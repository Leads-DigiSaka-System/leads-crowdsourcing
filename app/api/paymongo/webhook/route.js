import { sendDonationThankYouEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    clusterApiUrl,
} from "@solana/web3.js"
import crypto from "crypto"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"


const TIMESTAMP_TOLERANCE = 300 // 5 minutes
const MAX_BODY_SIZE = 1024 * 1024 // 1MB limit
const SUPPORTED_EVENT_TYPES = new Set(['checkout_session.payment.paid'])
const MAX_RETRIES = 3
const RETRY_DELAY = 1000


const logger = {
    info: (message, meta = {}) => {
        console.log(JSON.stringify({
            level: 'info',
            message,
            timestamp: new Date().toISOString(),
            ...meta
        }))
    },
    warn: (message, meta = {}) => {
        console.warn(JSON.stringify({
            level: 'warn',
            message,
            timestamp: new Date().toISOString(),
            ...meta
        }))
    },
    error: (message, error = null, meta = {}) => {
        console.error(JSON.stringify({
            level: 'error',
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            } : null,
            timestamp: new Date().toISOString(),
            ...meta
        }))
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const createErrorResponse = (message, status = 500, code = null) => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    return NextResponse.json(
        {
            error: message,
            ...(isDevelopment && code && { code })
        },
        { status }
    )
}

const safeParseInt = (value, fallback = 0) => {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? fallback : parsed
}

const extractSignatureComponents = (signatureHeader) => {
    const components = { timestamp: null, teValues: [], liValues: [] }

    if (!signatureHeader || typeof signatureHeader !== 'string') {
        return { error: 'Invalid signature header format', status: 400 }
    }

    try {
        const tokens = signatureHeader
            .trim()
            .split(/[;,]\s*/)
            .map(p => p.trim())
            .filter(Boolean)

        for (const token of tokens) {
            const idx = token.indexOf("=")
            if (idx === -1) continue

            const key = token.slice(0, idx).trim().toLowerCase()
            let value = token.slice(idx + 1).trim()


            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
            }


            if ((key.includes('te') || key.includes('li')) && value && !/^[a-f0-9]+$/i.test(value)) {
                logger.warn('Invalid signature format detected', { key, valueLength: value.length })
                continue
            }

            switch (key) {
                case "t":
                case "timestamp":
                    components.timestamp = value
                    break
                case "te":
                case "test":
                case "test_signature":
                    if (value) components.teValues.push(value)
                    break
                case "li":
                case "live":
                case "live_signature":
                    if (value) components.liValues.push(value)
                    break
            }
        }
    } catch (error) {
        logger.error("Error parsing signature header", error)
        return { error: 'Failed to parse signature header', status: 400 }
    }

    return components
}

const verifySignature = (body, timestamp, teValues, liValues, secret) => {
    if (!body || !timestamp || !secret) {
        return false
    }

    try {
        const signedPayload = `${timestamp}.${body}`
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(signedPayload, "utf8")
            .digest("hex")


        const teMatch = teValues.some(sig => {
            if (!sig || sig.length !== expectedSignature.length) return false
            try {
                return crypto.timingSafeEqual(
                    Buffer.from(expectedSignature, 'hex'),
                    Buffer.from(sig, 'hex')
                )
            } catch {
                return false
            }
        })

        const liMatch = liValues.some(sig => {
            if (!sig || sig.length !== expectedSignature.length) return false
            try {
                return crypto.timingSafeEqual(
                    Buffer.from(expectedSignature, 'hex'),
                    Buffer.from(sig, 'hex')
                )
            } catch {
                return false
            }
        })

        return teMatch || liMatch
    } catch (error) {
        logger.error('Signature verification failed', error)
        return false
    }
}

const validateTimestamp = (timestamp) => {
    if (!timestamp) return false

    const nowSec = Math.floor(Date.now() / 1000)
    const tsNum = safeParseInt(timestamp)

    if (!Number.isFinite(tsNum) || tsNum <= 0) return false
    return Math.abs(nowSec - tsNum) <= TIMESTAMP_TOLERANCE
}

// -------------------- SOLANA HELPERS --------------------
const SOLANA_MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")

const getSolanaConnection = () => {
    const rpcUrl = (process.env.SOLANA_RPC_URL || "devnet").trim()
    const endpoint = rpcUrl === "devnet" || rpcUrl === "mainnet-beta" || rpcUrl === "testnet"
        ? clusterApiUrl(rpcUrl)
        : rpcUrl
    const commitment = (process.env.SOLANA_COMMITMENT || "confirmed").trim()
    return new Connection(endpoint, commitment)
}

const parseKeypairFromEnv = () => {
    const raw = process.env.SOLANA_PRIVATE_KEY
    if (!raw) return null
    const trimmed = raw.trim().replace(/^['"]|['"]$/g, "")
    try {
        // Try JSON array (preferred). It may be a stringified array of numbers.
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            const arr = JSON.parse(trimmed)
            const bytes = Uint8Array.from(arr)
            return Keypair.fromSecretKey(bytes)
        }
    } catch (_) {
        // fallthrough
    }
    try {
        // Try base58 using bs58 without extra deps by leveraging web3.js utils
        // web3.js exports a built-in base58 via PublicKey; we can decode via Buffer.from(bs58.decode(...))
        // But to avoid extra imports, support hex as well.
        // If it's base58, Keypair.fromSecretKey expects 64-byte secret key, not seed.
        // Commonly exported as base58 of secret key; attempt to decode via Buffer.from and catch errors.
        // Note: Node doesn't decode base58 natively; we skip base58 to avoid another dependency.
        // Instead, support hex: "a1b2..." -> Buffer
        if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length % 2 === 0) {
            const buf = Buffer.from(trimmed, "hex")
            return Keypair.fromSecretKey(new Uint8Array(buf))
        }
    } catch (_) {
        // fallthrough
    }
    return null
}

const shouldLogToSolana = () => {
    // Only attempt when a private key is configured
    return Boolean(process.env.SOLANA_PRIVATE_KEY)
}

const truncateUtf8 = (str, maxBytes) => {
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    const bytes = enc.encode(str)
    if (bytes.length <= maxBytes) return str
    // truncate and ensure valid UTF-8
    const sliced = bytes.slice(0, maxBytes)
    return dec.decode(sliced)
}

const sendSolanaMemo = async ({ amount, title, authors, allocationsSummary, unallocated }) => {
    logger.info('[SOLANA] Starting sendSolanaMemo', {
        amount,
        title,
        hasPrivateKey: Boolean(process.env.SOLANA_PRIVATE_KEY),
        privateKeyLength: process.env.SOLANA_PRIVATE_KEY?.length
    })
    
    if (!shouldLogToSolana()) {
        logger.warn('[SOLANA] Skipping - no private key configured')
        return { skipped: true, reason: "SOLANA_PRIVATE_KEY not configured" }
    }

    logger.info('[SOLANA] Parsing keypair from env')
    const keypair = parseKeypairFromEnv()
    if (!keypair) {
        logger.error('[SOLANA] Failed to parse keypair from SOLANA_PRIVATE_KEY')
        return { skipped: true, reason: "Unable to parse SOLANA_PRIVATE_KEY" }
    }
    logger.info('[SOLANA] Keypair parsed successfully', {
        publicKey: keypair.publicKey.toBase58()
    })

    const connection = getSolanaConnection()
    logger.info('[SOLANA] Connection established', {
        endpoint: connection.rpcEndpoint
    })

    // Prepare memo payload (keep small)
    const payload = {
        amount,
        title,
        authors,
        // Include a very compact allocation summary: [ [name, allocated/value], ... ]
        ...(Array.isArray(allocationsSummary) && allocationsSummary.length > 0 && { a: allocationsSummary }),
        ...(typeof unallocated === 'number' && unallocated > 0 && { u: unallocated }),
        ts: Math.floor(Date.now() / 1000)
    }
    let memo = JSON.stringify(payload)
    // Memo program supports reasonably sized strings; keep it under ~200 bytes to be safe
    memo = truncateUtf8(memo, 200)
    
    logger.info('[SOLANA] Memo payload prepared', {
        memoLength: memo.length,
        memo
    })

    const ix = new TransactionInstruction({
        keys: [],
        programId: SOLANA_MEMO_PROGRAM_ID,
        data: Buffer.from(memo, "utf8"),
    })

    const tx = new Transaction().add(ix)
    tx.feePayer = keypair.publicKey
    
    logger.info('[SOLANA] Getting latest blockhash')
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    logger.info('[SOLANA] Blockhash received', { blockhash, lastValidBlockHeight })

    tx.sign(keypair)
    logger.info('[SOLANA] Transaction signed')

    const raw = tx.serialize()
    logger.info('[SOLANA] Sending raw transaction', {
        serializedLength: raw.length
    })
    
    const sig = await connection.sendRawTransaction(raw, { skipPreflight: false })
    logger.info('[SOLANA] Transaction sent', { signature: sig })
    
    const commitment = (process.env.SOLANA_COMMITMENT || "confirmed").trim()

    try {
        logger.info('[SOLANA] Confirming transaction (using polling)', { signature: sig, commitment })
        
        // Use HTTP polling instead of WebSocket-based confirmTransaction (not supported in serverless)
        const maxAttempts = 30 // 30 attempts
        const pollInterval = 2000 // 2 seconds between attempts
        let confirmed = false
        
        for (let i = 0; i < maxAttempts; i++) {
            const status = await connection.getSignatureStatus(sig)
            
            if (status?.value?.confirmationStatus === commitment || 
                status?.value?.confirmationStatus === 'finalized') {
                confirmed = true
                logger.info('[SOLANA] Transaction confirmed successfully', { 
                    signature: sig, 
                    confirmationStatus: status.value.confirmationStatus,
                    attempts: i + 1
                })
                break
            }
            
            if (status?.value?.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
            }
            
            // Wait before next poll
            if (i < maxAttempts - 1) {
                await sleep(pollInterval)
            }
        }
        
        if (!confirmed) {
            logger.warn('[SOLANA] Transaction confirmation timeout', { signature: sig })
            return { signature: sig, network: connection.rpcEndpoint, confirmationError: 'Timeout waiting for confirmation' }
        }
    } catch (confirmError) {
        logger.warn("Solana transaction confirmation failed or timed out", { 
            signature: sig, 
            error: confirmError.message,
            errorName: confirmError.name
        })
        return { signature: sig, network: connection.rpcEndpoint, confirmationError: confirmError.message }
    }

    logger.info('[SOLANA] Solana memo sent successfully', { 
        signature: sig, 
        network: connection.rpcEndpoint 
    })
    return { signature: sig, network: connection.rpcEndpoint }
}

const extractPaymentData = (sessionData) => {
    if (!sessionData?.id || !sessionData?.attributes) {
        return { error: 'Invalid session data structure', status: 400 }
    }

    const attributes = sessionData.attributes
    const lineItem = attributes.line_items?.[0]
    const amountRaw = attributes.payment_intent?.attributes?.amount ||
        attributes.amount ||
        lineItem?.amount || 0

    const amountPhp = Math.round(Number(amountRaw) / 100)


    if (!Number.isFinite(amountPhp) || amountPhp <= 0) {
        return { error: 'Invalid payment amount', status: 400 }
    }


    const metadata = attributes.metadata || {}
    if (!metadata.projectId) {
        return { error: 'Missing projectId in metadata', status: 400 }
    }

    return {
        sessionId: sessionData.id,
        amountPhp,
        currency: lineItem?.currency || attributes.currency || "PHP",
        metadata,
        attributes
    }
}

const isRetriableError = (error) => {

    const retriableCodes = ['P1008', 'P1017', 'P1001', 'P1002']
    return retriableCodes.includes(error.code) ||
        error.message.includes('timeout') ||
        error.message.includes('connection')
}

const processPayment = async (paymentData, retryCount = 0) => {
    const { sessionId, amountPhp, metadata } = paymentData
    const { projectId, userId } = metadata

    try {

        const projectQuery = prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true }
        })

        const project = await Promise.race([
            projectQuery,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database query timeout')), 10000)
            )
        ])

        if (!project) {
            return { error: `Project ${projectId} not found`, status: 400 }
        }

        const transactionPromise = prisma.$transaction(async (tx) => {

            const existingPledge = await tx.pledge.findUnique({
                where: { paymongoId: sessionId },
                select: { id: true }
            })

            if (existingPledge) {
                logger.info('Duplicate payment detected', { sessionId })
                return { status: "duplicate", alreadyProcessed: true }
            }

            // Create pledge and capture its ID for later update
            const created = await tx.pledge.create({
                data: {
                    userId: userId || null,
                    projectId,
                    amount: amountPhp,
                    status: "paid",
                    paymongoId: sessionId,
                    paymongoData: paymentData.attributes,
                },
                select: { id: true },
            })

            // Do NOT increment project.pledged; it's derived from pledges now

            // Allocate donation using position ordering (frontend funding component logic)
            // Rule: Ascending position, tie-break id asc. If all positions are null OR all zero -> fallback to id asc.
            let remaining = amountPhp
            const allocations = []
            const rawItems = await tx.budgetItem.findMany({
                where: { projectId },
                orderBy: { id: 'asc' }, // deterministic base order
                select: { id: true, name: true, value: true, allocated: true, position: true }
            })

            // Filter out any accidental zero/invalid value items (value must be > 0 per requirements)
            const valueFiltered = rawItems.filter(it => (Number(it.value) || 0) > 0)
            const allPosNull = valueFiltered.every(it => it.position == null)
            const allPosZero = !allPosNull && valueFiltered.every(it => Number(it.position) === 0)

            const items = (allPosNull || allPosZero)
                ? valueFiltered.slice().sort((a, b) => a.id - b.id)
                : valueFiltered.slice().sort((a, b) => {
                    const pa = (a.position == null) ? Number.MAX_SAFE_INTEGER : a.position
                    const pb = (b.position == null) ? Number.MAX_SAFE_INTEGER : b.position
                    if (pa !== pb) return pa - pb
                    return a.id - b.id
                })

            for (const item of items) {
                if (remaining <= 0) break
                const need = Math.max(0, (Number(item.value) || 0) - (Number(item.allocated) || 0))
                if (need <= 0) continue
                const take = Math.min(remaining, need)

                if (take <= 0) continue

                await tx.budgetItem.update({
                    where: { id: item.id },
                    data: { allocated: { increment: take } }
                })

                const alloc = await tx.budgetAllocation.create({
                    data: { pledgeId: created.id, budgetItemId: item.id, amount: take },
                    select: { id: true }
                })
                allocations.push({ id: alloc.id, itemId: item.id, name: item.name, amount: take, value: item.value })
                remaining -= take
            }

            return {
                status: "success",
                amountPhp,
                projectId,
                pledgeId: created.id,
                allocations,
                unallocated: Math.max(0, remaining),
                alreadyProcessed: false
            }
        }, {
            timeout: 15000
        })

        return await transactionPromise

    } catch (error) {

        if (retryCount < MAX_RETRIES && isRetriableError(error)) {
            logger.warn(`Retrying payment processing (attempt ${retryCount + 1})`, {
                sessionId,
                error: error.message
            })
            await sleep(RETRY_DELAY * (retryCount + 1))
            return processPayment(paymentData, retryCount + 1)
        }

        logger.error('Payment processing failed', error, { sessionId, retryCount })
        return {
            error: retryCount >= MAX_RETRIES
                ? 'Payment processing failed after retries'
                : error.message,
            status: 500
        }
    }
}

const validateEnvironment = () => {
    const requiredEnvVars = ['PAYMONGO_WEBHOOK_SECRET', 'DATABASE_URL']
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
}

export async function POST(req) {
    const startTime = Date.now()

    try {

        validateEnvironment()


        const contentLength = req.headers.get("content-length")
        if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
            return createErrorResponse("Request body too large", 413)
        }

        const body = await req.text()

        if (!body) {
            return createErrorResponse("Empty request body", 400)
        }


        let signatureHeader = req.headers.get("paymongo-signature")
        if (!signatureHeader) {

            for (const [key, value] of req.headers.entries()) {
                if (key.toLowerCase() === "paymongo-signature") {
                    signatureHeader = value
                    break
                }
            }
        }

        if (!signatureHeader) {
            return createErrorResponse("Missing signature header", 401)
        }


        const rawSecret = process.env.PAYMONGO_WEBHOOK_SECRET
        const WEBHOOK_SECRET = rawSecret?.trim().replace(/^['"]|['"]$/g, "")
        if (!WEBHOOK_SECRET) {
            logger.error('Missing PAYMONGO_WEBHOOK_SECRET environment variable')
            return createErrorResponse("Server configuration error", 500)
        }


        const signatureResult = extractSignatureComponents(signatureHeader)
        if (signatureResult.error) {
            return createErrorResponse(signatureResult.error, signatureResult.status)
        }

        const { timestamp, teValues, liValues } = signatureResult

        if (!timestamp || (teValues.length === 0 && liValues.length === 0)) {
            return createErrorResponse("Invalid signature format", 400)
        }


        if (!validateTimestamp(timestamp)) {
            return createErrorResponse("Invalid or expired timestamp", 400)
        }


        if (!verifySignature(body, timestamp, teValues, liValues, WEBHOOK_SECRET)) {
            return createErrorResponse("Invalid signature", 401)
        }


        let event
        try {
            event = JSON.parse(body)
        } catch (error) {
            return createErrorResponse("Invalid JSON payload", 400)
        }

        const eventType = event?.data?.attributes?.type


        logger.info('Webhook received', {
            eventType,
            eventId: event?.data?.id,
            processingTime: Date.now() - startTime
        })


        if (!SUPPORTED_EVENT_TYPES.has(eventType)) {
            logger.info('Ignoring unsupported event', { eventType })
            return NextResponse.json({ status: "ignored" })
        }


        if (eventType === "checkout_session.payment.paid") {
            const sessionData = event.data.attributes.data

            const paymentDataResult = extractPaymentData(sessionData)
            if (paymentDataResult.error) {
                return createErrorResponse(paymentDataResult.error, paymentDataResult.status)
            }

            const result = await processPayment(paymentDataResult)

            if (result.error) {
                return createErrorResponse(result.error, result.status)
            }

            if (result.alreadyProcessed) {
                logger.info('Duplicate payment processed', {
                    sessionId: paymentDataResult.sessionId
                })
                return NextResponse.json({ status: "already_processed" })
            }

            // After DB success, attempt Solana memo logging (non-blocking for webhook success)
            let solanaLog = { attempted: false }
            let projectTitle = ""
            try {
                // Fetch minimal project info for memo
                logger.info('Fetching project details for Solana memo', { projectId: result.projectId })
                const proj = await prisma.project.findUnique({
                    where: { id: result.projectId },
                    select: { title: true, authors: true }
                })
                const title = proj?.title || ""
                projectTitle = title
                const authors = proj?.authors || ""
                logger.info('Project details fetched', { title, authors, projectId: result.projectId })
                
                // Build compact allocations summary: [[shortName, allocated/current], ...]
                const allocationsSummary = Array.isArray(result.allocations)
                    ? result.allocations.slice(0, 5).map(a => {
                        const shortName = (a.name || '').slice(0, 24)
                        const current = typeof a.value === 'number' && a.value > 0 ? `${a.amount}/${a.value}` : String(a.amount)
                        return [shortName, current]
                    })
                    : []
                
                if (shouldLogToSolana()) {
                    logger.info('Starting Solana memo logging', { 
                        pledgeId: result.pledgeId,
                        amount: result.amountPhp,
                        hasPrivateKey: Boolean(process.env.SOLANA_PRIVATE_KEY)
                    })
                    solanaLog.attempted = true
                    const memoRes = await sendSolanaMemo({
                        amount: result.amountPhp,
                        title,
                        authors,
                        allocationsSummary,
                        unallocated: typeof result.unallocated === 'number' ? result.unallocated : 0,
                    })
                    solanaLog = { ...solanaLog, ...memoRes }
                    logger.info('Solana memo response received', { 
                        signature: memoRes?.signature,
                        skipped: memoRes?.skipped,
                        confirmationError: memoRes?.confirmationError,
                        network: memoRes?.network
                    })
                    
                    if (memoRes?.signature && result?.pledgeId) {
                        logger.info('Attempting to update pledge with solanaSignature', {
                            pledgeId: result.pledgeId,
                            signature: memoRes.signature
                        })
                        try {
                            const updatedPledge = await prisma.pledge.update({
                                where: { id: result.pledgeId },
                                data: { solanaSignature: memoRes.signature },
                            })
                            logger.info('Successfully updated pledge with solanaSignature', {
                                pledgeId: result.pledgeId,
                                signature: memoRes.signature,
                                updatedPledgeId: updatedPledge.id
                            })
                        } catch (e) {
                            logger.error("Failed to persist solanaSignature on pledge", e, { 
                                pledgeId: result.pledgeId,
                                signature: memoRes.signature,
                                errorCode: e?.code,
                                errorMeta: e?.meta
                            })
                        }
                    } else {
                        logger.warn('Skipping pledge update - missing signature or pledgeId', {
                            hasSignature: Boolean(memoRes?.signature),
                            hasPledgeId: Boolean(result?.pledgeId),
                            signature: memoRes?.signature,
                            pledgeId: result?.pledgeId
                        })
                    }
                } else {
                    logger.info('Solana logging skipped - SOLANA_PRIVATE_KEY not configured')
                    solanaLog = { attempted: false, skipped: true, reason: "SOLANA_PRIVATE_KEY not configured" }
                }
            } catch (e) {
                logger.error("Solana memo logging failed", e, {
                    projectId: result.projectId,
                    pledgeId: result.pledgeId,
                    errorCode: e?.code,
                    errorMeta: e?.meta
                })
                solanaLog = { attempted: true, error: e?.message || String(e) }
            }

            // Send thank-you email to donor (non-blocking for webhook success)
            try {
                const userId = paymentDataResult?.metadata?.userId || null
                logger.info('Starting email sending process', { 
                    userId,
                    hasUserId: Boolean(userId),
                    metadata: paymentDataResult?.metadata
                })
                
                if (userId) {
                    logger.info('Fetching user details for email', { userId })
                    const user = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { email: true, name: true }
                    })
                    logger.info('User details fetched', { 
                        userId,
                        hasUser: Boolean(user),
                        hasEmail: Boolean(user?.email),
                        email: user?.email ? `${user.email.substring(0, 3)}***` : null,
                        name: user?.name
                    })
                    
                    if (user?.email) {
                        // Derive Solana cluster from env
                        const raw = (process.env.SOLANA_RPC_URL || "devnet").trim()
                        const cluster = ["devnet", "mainnet-beta", "testnet"].includes(raw) ? raw : (raw.includes("mainnet") ? "mainnet-beta" : (raw.includes("devnet") ? "devnet" : ""))
                        const signature = solanaLog?.signature || null
                        
                        logger.info('Sending donation thank-you email', {
                            to: user.email,
                            projectTitle: projectTitle || "the research project",
                            amountPhp: result.amountPhp,
                            hasSignature: Boolean(signature),
                            signature,
                            cluster,
                            hasResendApiKey: Boolean(process.env.RESEND_API_KEY)
                        })
                        
                        const emailResult = await sendDonationThankYouEmail({
                            to: user.email,
                            projectTitle: projectTitle || "the research project",
                            amountPhp: result.amountPhp,
                            signature,
                            cluster
                        })
                        
                        logger.info('Email sent successfully', {
                            emailId: emailResult?.data?.id || emailResult?.id,
                            to: user.email,
                            result: emailResult
                        })
                    } else {
                        logger.warn('Cannot send email - user has no email address', { 
                            userId,
                            hasUser: Boolean(user)
                        })
                    }
                } else {
                    logger.warn('Cannot send email - no userId in metadata', {
                        metadata: paymentDataResult?.metadata
                    })
                }
            } catch (e) {
                logger.error("Failed to send donation thank-you email", e, { 
                    userId: paymentDataResult?.metadata?.userId,
                    errorCode: e?.code,
                    errorName: e?.name,
                    errorMeta: e?.meta,
                    stack: e?.stack
                })
            }

            logger.info('Payment processed successfully', {
                amount: result.amountPhp,
                projectId: result.projectId,
                sessionId: paymentDataResult.sessionId,
                processingTime: Date.now() - startTime,
                solana: solanaLog,
                ...(typeof result.unallocated === 'number' && { unallocated: result.unallocated })
            })

            return NextResponse.json({
                status: "success",
                amount: result.amountPhp,
                currency: paymentDataResult.currency,
                projectId: result.projectId,
                allocations: (result.allocations || []).map(a => ({ itemId: a.itemId, name: a.name, amount: a.amount })),
                ...(typeof result.unallocated === 'number' && result.unallocated > 0 && { unallocated: result.unallocated }),
                ...(solanaLog.signature && { solanaSignature: solanaLog.signature }),
                ...(solanaLog.skipped && { solana: "skipped" })
            })
        }

        return NextResponse.json({ status: "ignored" })

    } catch (error) {
        logger.error('Webhook processing failed', error, {
            processingTime: Date.now() - startTime
        })

        const isDevelopment = process.env.NODE_ENV === 'development'
        return NextResponse.json(
            {
                error: isDevelopment ? error.message : "Internal server error"
            },
            { status: 500 }
        )
    }
}