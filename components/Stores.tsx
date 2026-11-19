"use client";

import Reveal from "./Reveal";
import { useSettings } from "@/lib/storefront";


export default function Stores() {
  const stores = useSettings().stores;
  return (
    <section className="stores" id="stores">
      <div className="wrap">
        <Reveal>
          <div className="sechead" style={{ display: "block" }}>
            <h2 style={{ marginBottom: 8 }}>Stores Across Bangladesh</h2>
            <span className="open-now">
              <i /> Open now
            </span>
          </div>
        </Reveal>
        <div className="storegrid">
          {stores.map((s, i) => (
            <Reveal key={s.city} delay={(i % 3) as 0 | 1 | 2}>
              <div className="store">
                <span className="open-now">
                  <i /> Open now
                </span>
                <h3>{s.city}</h3>
                <p style={{ whiteSpace: "pre-line" }}>{s.address}</p>
                <p className="phone">{s.phone}</p>
                <a
                  className="dir"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`TRAC ${s.city} Bangladesh`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get Direction &rarr;
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
