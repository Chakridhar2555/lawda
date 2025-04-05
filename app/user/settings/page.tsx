'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Settings {
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    darkMode: true,
    language: 'English',
    timezone: 'UTC-5',
  });

  const handleToggle = (key: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInputChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Settings</h1>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-100">Email Notifications</Label>
              <p className="text-sm text-gray-400">Receive email notifications for important updates</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-100">Dark Mode</Label>
              <p className="text-sm text-gray-400">Toggle dark mode theme</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={() => handleToggle('darkMode')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-gray-100">Language</Label>
              <Input
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-100">Timezone</Label>
              <Input
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-red-500 hover:bg-red-600">
          Save Changes
        </Button>
      </div>
    </div>
  );
} 