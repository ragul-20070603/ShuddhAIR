'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Info, Lock } from 'lucide-react';


export function SettingsTab() {
  return (
    <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                    <h3 className="font-medium">Language</h3>
                    <p className="text-sm text-muted-foreground">Choose your preferred language for the UI and advisories.</p>
                </div>
                <LanguageSwitcher />
            </div>

             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                    <h3 className="font-medium">Appearance</h3>
                    <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
                </div>
                <ThemeToggle />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                    <h3 className="font-medium">About ShuddhAI</h3>
                    <p className="text-sm text-muted-foreground">Learn more about the app's mission and data sources.</p>
                </div>
                <Button variant="outline" size="icon"><Info/></Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                    <h3 className="font-medium">Privacy Policy</h3>
                    <p className="text-sm text-muted-foreground">Read about how we handle your data.</p>
                </div>
                <Button variant="outline" size="icon"><Lock/></Button>
            </div>
        </CardContent>
    </Card>
  )
}
