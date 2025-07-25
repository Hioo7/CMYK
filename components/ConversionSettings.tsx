'use client';

import React from 'react';
import { Settings, Palette, Sliders } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ConversionSettingsProps {
  settings: {
    quality: number;
    preserveTransparency: boolean;
    iccProfile: string;
    blackGeneration: string;
  };
  onSettingsChange: (settings: any) => void;
}

export function ConversionSettings({ settings, onSettingsChange }: ConversionSettingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-700/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-700/50 rounded-lg">
                  <Settings className="w-5 h-5 text-slate-300" />
                </div>
                <CardTitle className="text-white">Conversion Settings</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400">
                {isOpen ? '−' : '+'}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Quality Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 flex items-center space-x-2">
                  <Sliders className="w-4 h-4" />
                  <span>Output Quality</span>
                </Label>
                <span className="text-sm text-slate-400">{settings.quality}%</span>
              </div>
              <Slider
                value={[settings.quality]}
                onValueChange={(value) => updateSetting('quality', value[0])}
                max={100}
                min={70}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Higher quality preserves more detail but increases file size
              </p>
            </div>

            {/* ICC Profile Selection */}
            <div className="space-y-3">
              <Label className="text-slate-300 flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>ICC Profile</span>
              </Label>
              <Select value={settings.iccProfile} onValueChange={(value) => updateSetting('iccProfile', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="default">Default CMYK</SelectItem>
                  <SelectItem value="coated-fogra39">Coated FOGRA39</SelectItem>
                  <SelectItem value="uncoated-fogra29">Uncoated FOGRA29</SelectItem>
                  <SelectItem value="us-web-coated">US Web Coated</SelectItem>
                  <SelectItem value="japan-color-2001">Japan Color 2001</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Choose the appropriate ICC profile for your printing process
              </p>
            </div>

            {/* Black Generation */}
            <div className="space-y-3">
              <Label className="text-slate-300">Black Generation</Label>
              <Select value={settings.blackGeneration} onValueChange={(value) => updateSetting('blackGeneration', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Controls how much black ink replaces CMY colors
              </p>
            </div>

            {/* Preserve Transparency */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-slate-300">Preserve Transparency</Label>
                <p className="text-xs text-slate-500">
                  Maintain alpha channel in converted images
                </p>
              </div>
              <Switch
                checked={settings.preserveTransparency}
                onCheckedChange={(checked) => updateSetting('preserveTransparency', checked)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}