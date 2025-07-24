import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Settings, Shield, BarChart3, Target, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConsentSettings {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  personalization: boolean;
}

const ConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentSettings>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    advertising: false,
    personalization: false,
  });

  useEffect(() => {
    // Check if consent has already been given
    const savedConsent = localStorage.getItem('cookie-consent');
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      const parsedConsent = JSON.parse(savedConsent);
      setConsent(parsedConsent);
      updateGoogleConsent(parsedConsent);
    }
  }, []);

  const updateGoogleConsent = (consentSettings: ConsentSettings) => {
    // Update Google Analytics consent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: consentSettings.analytics ? 'granted' : 'denied',
        ad_storage: consentSettings.advertising ? 'granted' : 'denied',
        ad_user_data: consentSettings.advertising ? 'granted' : 'denied',
        ad_personalization: consentSettings.personalization ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
      });
    }
  };

  const saveConsent = (consentSettings: ConsentSettings) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consentSettings));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    updateGoogleConsent(consentSettings);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      advertising: true,
      personalization: true,
    };
    setConsent(allAccepted);
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      advertising: false,
      personalization: false,
    };
    setConsent(necessaryOnly);
    saveConsent(necessaryOnly);
  };

  const saveSettings = () => {
    saveConsent(consent);
  };

  const updateConsentSetting = (key: keyof ConsentSettings, value: boolean) => {
    if (key === 'necessary') return; // Can't change necessary cookies
    setConsent(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <Card className="mx-auto max-w-4xl bg-background/95 backdrop-blur-sm border shadow-lg">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    We respect your privacy
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your browsing experience, serve personalized content, 
                    and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                    You can manage your preferences or learn more in our{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    GDPR Compliant
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Analytics
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Marketing
                  </Badge>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={acceptNecessary}
                  className="text-xs"
                >
                  Necessary Only
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="text-xs"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which cookies you'd like to allow. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Necessary Cookies</h4>
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Essential for the website to function properly. These cannot be disabled.
                </p>
              </div>
              <Switch checked={true} disabled className="ml-4" />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">Analytics Cookies</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
              </div>
              <Switch 
                checked={consent.analytics}
                onCheckedChange={(checked) => updateConsentSetting('analytics', checked)}
                className="ml-4"
              />
            </div>

            {/* Advertising Cookies */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium">Advertising Cookies</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.
                </p>
              </div>
              <Switch 
                checked={consent.advertising}
                onCheckedChange={(checked) => updateConsentSetting('advertising', checked)}
                className="ml-4"
              />
            </div>

            {/* Personalization Cookies */}
            <div className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium">Personalization Cookies</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Remember your preferences and provide enhanced, personalized features.
                </p>
              </div>
              <Switch 
                checked={consent.personalization}
                onCheckedChange={(checked) => updateConsentSetting('personalization', checked)}
                className="ml-4"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsentBanner;