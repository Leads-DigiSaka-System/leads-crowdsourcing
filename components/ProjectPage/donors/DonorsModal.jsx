"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { shortSig } from '@/lib/utils';
import { ExternalLink, Loader2 } from 'lucide-react';

const ITEMS_PER_LOAD = 25;

const DonorsModal = ({ open, onOpenChange, donations = [] }) => {
    const [activeTab, setActiveTab] = useState('newest');
    const [displayedNewest, setDisplayedNewest] = useState(ITEMS_PER_LOAD);
    const [displayedTop, setDisplayedTop] = useState(ITEMS_PER_LOAD);
    const [isLoadingNewest, setIsLoadingNewest] = useState(false);
    const [isLoadingTop, setIsLoadingTop] = useState(false);

    const newestScrollRef = useRef(null);
    const topScrollRef = useRef(null);

    // Aggregate donations by user for "Top" tab
    const aggregatedDonors = useMemo(() => {
        const donorMap = new Map();

        donations.forEach(donation => {
            const userName = donation.userName;
            if (donorMap.has(userName)) {
                const existing = donorMap.get(userName);
                existing.totalAmount += donation.amount;
                existing.donationCount += 1;
            } else {
                donorMap.set(userName, {
                    userName,
                    totalAmount: donation.amount,
                    donationCount: 1,
                });
            }
        });

        // Convert to array and sort by total amount (highest to lowest)
        return Array.from(donorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    }, [donations]);

    // Reset displayed items when modal opens
    useEffect(() => {
        if (open) {
            setDisplayedNewest(ITEMS_PER_LOAD);
            setDisplayedTop(ITEMS_PER_LOAD);
            setActiveTab('newest');
        }
    }, [open]);

    // Infinite scroll handler for Newest tab
    const handleNewestScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingNewest && displayedNewest < donations.length) {
            setIsLoadingNewest(true);
            setTimeout(() => {
                setDisplayedNewest(prev => Math.min(prev + ITEMS_PER_LOAD, donations.length));
                setIsLoadingNewest(false);
            }, 300);
        }
    };

    // Infinite scroll handler for Top tab
    const handleTopScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingTop && displayedTop < aggregatedDonors.length) {
            setIsLoadingTop(true);
            setTimeout(() => {
                setDisplayedTop(prev => Math.min(prev + ITEMS_PER_LOAD, aggregatedDonors.length));
                setIsLoadingTop(false);
            }, 300);
        }
    };

    const visibleNewestDonations = donations.slice(0, displayedNewest);
    const visibleTopDonors = aggregatedDonors.slice(0, displayedTop);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl">All Donors</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <TabsList className="px-4 mt-2 grid w-full grid-cols-2">
                        <TabsTrigger value="newest">Newest</TabsTrigger>
                        <TabsTrigger value="top">Top Donors</TabsTrigger>
                    </TabsList>

                    {/* Newest Tab */}
                    <TabsContent
                        value="newest"
                        className="flex-1 px-6 pb-6 mt-4"
                    >
                        <div
                            className="flex-1 overflow-y-auto space-y-3"
                            onScroll={handleNewestScroll}
                            ref={newestScrollRef}
                            style={{ maxHeight: 'calc(80vh - 170px)' }}
                        >
                            {visibleNewestDonations.map((donation) => (
                                <Card key={donation.id} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-base capitalize">{donation.userName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(donation.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-lg font-bold text-green-600">
                                                ₱{donation.amount.toLocaleString()}
                                            </p>
                                            {donation.solanaSignature && (
                                                <a
                                                    href={`https://explorer.solana.com/tx/${donation.solanaSignature}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                                    title="View on Solana Explorer"
                                                >
                                                    <span className="font-mono">{shortSig(donation.solanaSignature)}</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {isLoadingNewest && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {displayedNewest >= donations.length && donations.length > ITEMS_PER_LOAD && (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    No more donations to load
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Top Donors Tab */}
                    <TabsContent
                        value="top"
                        className="flex-1 px-6 pb-6 mt-4"
                    >
                        <div
                            className="flex-1 overflow-y-auto space-y-3"
                            onScroll={handleTopScroll}
                            ref={topScrollRef}
                            style={{ maxHeight: 'calc(80vh - 170px)' }}
                        >
                            {visibleTopDonors.map((donor, index) => (
                                <Card key={`${donor.userName}-${index}`} className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-base capitalize">{donor.userName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {donor.donationCount} {donor.donationCount === 1 ? 'donation' : 'donations'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-bold text-green-600">
                                                ₱{donor.totalAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {isLoadingTop && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {displayedTop >= aggregatedDonors.length && aggregatedDonors.length > ITEMS_PER_LOAD && (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    No more donors to load
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default DonorsModal;
