"use client";

import Script from "next/script";

export default function HelpScoutBeacon() {
  return (
    <>
      <Script id="helpscout-loader" strategy="afterInteractive">
        {`
          !function(e,t,n){
            function a(){
              var e=t.getElementsByTagName("script")[0],
              n=t.createElement("script");
              n.type="text/javascript";
              n.async=!0;
              n.src="https://beacon-v2.helpscout.net";
              e.parentNode.insertBefore(n,e)
            }
            if(
              e.Beacon=n=function(t,n,a){
                e.Beacon.readyQueue.push({
                  method:t,
                  options:n,
                  data:a
                })
              },
              n.readyQueue=[],
              "complete"===t.readyState
            ) return a();
            e.attachEvent
              ? e.attachEvent("onload",a)
              : e.addEventListener("load",a,!1)
          }(window,document,window.Beacon||function(){});
        `}
      </Script>

      <Script id="helpscout-init" strategy="afterInteractive">
        {`
          window.Beacon &&
          window.Beacon('init', {
            beaconId: '2408e0d2-0d5c-4dde-9ef4-71280211d75d',
            hideFABOnMobile: true
          });
        `}
      </Script>
    </>
  );
}