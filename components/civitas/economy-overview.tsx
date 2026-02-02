
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Pickaxe, BookOpen, Crown } from "lucide-react";
import type { CityResourceBalance } from "@/lib/types/database";

interface EconomyOverviewProps {
    balances: CityResourceBalance;
}

export function EconomyOverview({ balances }: EconomyOverviewProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Pickaxe className="w-5 h-5" />
                    Economy
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ResourceItem
                        icon={<Pickaxe className="w-4 h-4 text-slate-500" />}
                        label="Materials"
                        value={balances.materials}
                    />
                    <ResourceItem
                        icon={<Zap className="w-4 h-4 text-yellow-500" />}
                        label="Energy"
                        value={balances.energy}
                    />
                    <ResourceItem
                        icon={<BookOpen className="w-4 h-4 text-blue-500" />}
                        label="Knowledge"
                        value={balances.knowledge}
                    />
                    <ResourceItem
                        icon={<Crown className="w-4 h-4 text-purple-500" />}
                        label="Influence"
                        value={balances.influence}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function ResourceItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="text-xl font-bold">{value.toLocaleString()}</div>
        </div>
    );
}
