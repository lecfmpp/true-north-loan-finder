// Third-party script loader with deferred loading strategy
// Loads analytics scripts only after user interaction to improve initial page load

type ScriptConfig = {
  id: string;
  src?: string;
  innerHTML?: string;
  async?: boolean;
  defer?: boolean;
};

class ThirdPartyLoader {
  private loaded = new Set<string>();
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load scripts after user interaction or 3 seconds idle
    const loadScripts = () => {
      this.loadGoogleAnalytics();
      this.loadTikTokPixel();
      this.loadFacebookPixel();
      this.loadSpymePixel();
    };

    // Trigger on first user interaction
    const events = ['scroll', 'click', 'mousemove', 'touchstart', 'keydown'];
    const onInteraction = () => {
      events.forEach(event => window.removeEventListener(event, onInteraction));
      loadScripts();
    };

    events.forEach(event => window.addEventListener(event, onInteraction, { passive: true, once: true }));

    // Fallback: Load after 3 seconds if no interaction
    setTimeout(loadScripts, 3000);
  }

  private loadScript(config: ScriptConfig): Promise<void> {
    if (this.loaded.has(config.id)) return Promise.resolve();
    this.loaded.add(config.id);

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = config.id;
      
      if (config.src) {
        script.src = config.src;
        script.async = config.async ?? true;
        script.defer = config.defer ?? true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${config.id}`));
      } else if (config.innerHTML) {
        script.innerHTML = config.innerHTML;
        setTimeout(resolve, 0);
      }

      document.head.appendChild(script);
    });
  }

  private loadGoogleAnalytics() {
    const gtagId = 'G-H4CVDRD44F';
    
    // Load gtag script
    this.loadScript({
      id: 'gtag-script',
      src: `https://www.googletagmanager.com/gtag/js?id=${gtagId}`,
    }).then(() => {
      // Initialize gtag
      this.loadScript({
        id: 'gtag-init',
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gtagId}');
        `,
      });
    }).catch(console.error);
  }

  private loadTikTokPixel() {
    this.loadScript({
      id: 'tiktok-pixel',
      innerHTML: `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

          ttq.load('CST5F53C77UB8KNVVKBG');
          ttq.page();
        }(window, document, 'ttq');
      `,
    }).catch(console.error);
  }

  private loadFacebookPixel() {
    this.loadScript({
      id: 'facebook-pixel',
      innerHTML: `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '1276631046649850');
        fbq('track', 'PageView');
      `,
    }).catch(console.error);
  }

  private loadSpymePixel() {
    this.loadScript({
      id: 'spyme-pixel',
      innerHTML: `
        !function(s,p,y,m,e){s[m]=s[m]||function(){(s[m].q=s[m].q||[]).push(arguments)};
        e=p.createElement(y);e.async=1;e.src='https://app.spyme.com/pixel/'+5029+'/init.js';
        y=p.getElementsByTagName(y)[0];y.parentNode.insertBefore(e,y)}(window,document,'script','spyme');
        spyme('init');
      `,
    }).catch(console.error);
  }
}

// Export singleton instance
export const thirdPartyLoader = new ThirdPartyLoader();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => thirdPartyLoader.init());
  } else {
    thirdPartyLoader.init();
  }
}
