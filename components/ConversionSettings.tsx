'use client';

import React from 'react';
import { Settings, ChevronDown, ChevronUp, Palette, Sliders } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';

interface Settings {
  quality: number;
  preserveTransparency: boolean;
  iccProfile: string;
  blackGeneration: string;
}

interface ConversionSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function ConversionSettings({ settings, onSettingsChange }: ConversionSettingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card className="bg-gray-900/70 border-gray-700/60 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-800/40 transition-colors rounded-t-lg py-3 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gray-800 rounded-md">
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
                <CardTitle className="text-white text-sm font-medium">Conversion Settings</CardTitle>
              </div>
              {isOpen
                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                : <ChevronDown className="w-4 h-4 text-gray-500" />
              }
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-5 pb-5 space-y-5 pt-1">

            {/* ICC Profile */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-500" />
                ICC Profile
              </Label>
              <Select value={settings.iccProfile} onValueChange={v => update('iccProfile', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="default">Default CMYK</SelectItem>
                  <SelectItem value="coated-fogra39">Coated FOGRA39</SelectItem>
                  <SelectItem value="uncoated-fogra29">Uncoated FOGRA29</SelectItem>
                  <SelectItem value="us-web-coated">US Web Coated</SelectItem>
                  <SelectItem value="japan-color-2001">Japan Color 2001</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">Select the color profile for your print process</p>
            </div>

            {/* Black Generation */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                Black Generation (GCR)
              </Label>
              <Select value={settings.blackGeneration} onValueChange={v => update('blackGeneration', v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="none">None — max color fidelity</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">How much K ink replaces CMY in neutral areas</p>
            </div>

            {/* Preserve Transparency */}
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-gray-300 text-xs">Preserve Transparency</Label>
                <p className="text-xs text-gray-600 mt-0.5">Keep alpha channel in output</p>
              </div>
              <Switch
                checked={settings.preserveTransparency}
                onCheckedChange={v => update('preserveTransparency', v)}
                className="data-[state=checked]:bg-cyan-600"
              />
            </div>

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
