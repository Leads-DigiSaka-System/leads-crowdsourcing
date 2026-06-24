"use client"
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { shortSig } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import DonorsModal from './DonorsModal';

const DonorsSection = ({ donations = [], totalCount = 0 }) => {
    const [showModal, setShowModal] = useState(false);

    // Get newest 5 donations for preview
    const previewDonations = donations.slice(0, 5);

    if (!donations.length) {
        return null;
    }

    return (
        <>
            <section className="max-w-6xl mx-auto px-4 py-8">
                <div className="">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold">Donors</h2>
                            <Badge variant="secondary" className="text-sm">
                                {totalCount} {totalCount === 1 ? 'Donation' : 'Donations'}
                            </Badge>
                        </div>
                        {donations.length > 5 && (
                            <Button
                                variant="outline"
                                onClick={() => setShowModal(true)}
                                className="text-sm"
                            >
                                See All
                            </Button>
                        )}
                    </div>

                    {/* Donations List */}
                    <div className="space-y-3">
                        {previewDonations.map((donation) => (
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
                    </div>
                </div>
            </section>

            {/* Modal */}
            <DonorsModal
                open={showModal}
                onOpenChange={setShowModal}
                donations={donations}
            />
        </>
    );
};

export default DonorsSection;
