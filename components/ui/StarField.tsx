"use client";

import { useEffect, useRef, useState } from "react";

// 星を5グループに分割 → 各グループが別タイミングでキラキラ
const GROUPS = [
  "363px 44px rgba(255,255,255,0.5),644px 59px rgba(255,255,255,0.6),131px 70px rgba(255,255,255,0.65),1411px 51px rgba(255,255,255,0.62),442px 59px rgba(255,255,255,0.45),578px 77px rgba(255,255,255,0.3),582px 6px rgba(255,255,255,0.52),869px 116px rgba(255,255,255,0.4),1332px 13px rgba(255,255,255,0.35),400px 74px rgba(255,255,255,0.32),630px 26px rgba(255,255,255,0.58),209px 77px rgba(255,255,255,0.6),347px 78px rgba(255,255,255,0.42),1269px 81px rgba(255,255,255,0.5),1099px 25px rgba(255,255,255,0.6),1287px 20px rgba(255,255,255,0.55),282px 31px rgba(255,255,255,0.45),790px 45px rgba(255,255,255,0.28),183px 72px rgba(255,255,255,0.4),58px 18px rgba(255,255,255,0.56)",
  "320px 188px rgba(255,255,255,0.25),1194px 233px rgba(255,255,255,0.28),485px 157px rgba(255,255,255,0.3),169px 122px rgba(255,255,255,0.5),557px 142px rgba(255,255,255,0.45),528px 237px rgba(255,255,255,0.35),779px 251px rgba(255,255,255,0.65),72px 170px rgba(255,255,255,0.42),829px 152px rgba(255,255,255,0.52),962px 234px rgba(255,255,255,0.35),1354px 224px rgba(255,255,255,0.38),202px 54px rgba(255,255,255,0.35),149px 171px rgba(255,255,255,0.42),265px 154px rgba(255,255,255,0.38),736px 136px rgba(255,255,255,0.32),512px 236px rgba(255,255,255,0.42),1195px 196px rgba(255,255,255,0.48),1259px 130px rgba(255,255,255,0.5),853px 182px rgba(255,255,255,0.55),426px 116px rgba(255,255,255,0.65)",
  "1217px 340px rgba(255,255,255,0.4),843px 348px rgba(255,255,255,0.55),1176px 349px rgba(255,255,255,0.6),777px 326px rgba(255,255,255,0.68),1216px 366px rgba(255,255,255,0.62),1064px 268px rgba(255,255,255,0.68),1415px 311px rgba(255,255,255,0.58),327px 347px rgba(255,255,255,0.62),1121px 322px rgba(255,255,255,0.6),966px 303px rgba(255,255,255,0.3),720px 286px rgba(255,255,255,0.65),1090px 223px rgba(255,255,255,0.58),343px 250px rgba(255,255,255,0.5),1109px 225px rgba(255,255,255,0.56),637px 257px rgba(255,255,255,0.55),954px 324px rgba(255,255,255,0.68),498px 103px rgba(255,255,255,0.58),1020px 436px rgba(255,255,255,0.52)",
  "1432px 427px rgba(255,255,255,0.45),924px 431px rgba(255,255,255,0.5),1331px 445px rgba(255,255,255,0.48),1358px 411px rgba(255,255,255,0.3),1035px 495px rgba(255,255,255,0.42),183px 384px rgba(255,255,255,0.5),481px 441px rgba(255,255,255,0.65),277px 436px rgba(255,255,255,0.48),602px 468px rgba(255,255,255,0.32),1326px 475px rgba(255,255,255,0.48),1104px 486px rgba(255,255,255,0.25),613px 374px rgba(255,255,255,0.42),1211px 457px rgba(255,255,255,0.32),1156px 480px rgba(255,255,255,0.58),979px 465px rgba(255,255,255,0.5),830px 445px rgba(255,255,255,0.56),391px 465px rgba(255,255,255,0.65),559px 491px rgba(255,255,255,0.56)",
  "260px 275px rgba(255,255,255,0.35),32px 269px rgba(255,255,255,0.6),1409px 400px rgba(255,255,255,0.3),455px 265px rgba(255,255,255,0.35),855px 350px rgba(255,255,255,0.48),445px 282px rgba(255,255,255,0.52),1038px 253px rgba(255,255,255,0.25),79px 272px rgba(255,255,255,0.5),828px 285px rgba(255,255,255,0.25),587px 295px rgba(255,255,255,0.28),407px 280px rgba(255,255,255,0.42),520px 350px rgba(255,255,255,0.35),944px 374px rgba(255,255,255,0.5),1085px 342px rgba(255,255,255,0.35),744px 349px rgba(255,255,255,0.22),328px 193px rgba(255,255,255,0.65),1394px 384px rgba(255,255,255,0.28),322px 393px rgba(255,255,255,0.62)",
];

const BRIGHT = "932px 92px rgba(255,255,255,0.95),1401px 34px rgba(255,255,255,0.98),372px 33px rgba(255,255,255,0.9),147px 14px rgba(255,255,255,0.88),1163px 32px rgba(255,255,255,0.92),1237px 36px rgba(255,255,255,0.85),258px 9px rgba(255,255,255,0.92),848px 225px rgba(255,255,255,0.88),918px 289px rgba(255,255,255,0.95),1010px 201px rgba(255,255,255,0.88),471px 176px rgba(255,255,255,0.9),964px 269px rgba(255,255,255,1.0),1325px 248px rgba(255,255,255,0.95)";

const TWINKLE_ANIMS = [
  "twinkle-a 3.8s ease-in-out infinite",
  "twinkle-b 5.2s ease-in-out infinite -1.4s",
  "twinkle-a 4.5s ease-in-out infinite -2.8s",
  "twinkle-b 6.1s ease-in-out infinite -0.7s",
  "twinkle-a 3.2s ease-in-out infinite -3.5s",
];

function ShootingStars() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timerId: ReturnType<typeof setTimeout>;

    const fire = () => {
      const el = document.createElement("div");
      const left = 5 + Math.random() * 75;   // 5〜80%
      const top  = 2 + Math.random() * 22;    // 2〜24%
      const len  = 120 + Math.random() * 80;  // 120〜200px
      const dur  = 0.75 + Math.random() * 0.5; // 0.75〜1.25s

      Object.assign(el.style, {
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${len}px`,
        height: "2px",
        borderRadius: "2px",
        background: "linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.5) 30%, transparent)",
        transform: "rotate(33deg)",
        transformOrigin: "left center",
        opacity: "0",
        animation: `shoot ${dur}s ease-out forwards`,
        pointerEvents: "none",
      });

      container.appendChild(el);
      el.addEventListener("animationend", () => el.remove(), { once: true });

      // 次の流れ星: 15〜40秒後
      timerId = setTimeout(fire, 15000 + Math.random() * 25000);
    };

    // 最初は 5〜12秒後に開始
    timerId = setTimeout(fire, 5000 + Math.random() * 7000);
    return () => clearTimeout(timerId);
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}

export function StarField() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[60vh] overflow-hidden opacity-0 dark:opacity-100 transition-opacity duration-700"
      style={{
        opacity: ready ? undefined : 0,
        maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
      }}
    >
      {GROUPS.map((shadows, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: 0, left: 0, width: 1, height: 1, borderRadius: "50%", boxShadow: shadows, animation: TWINKLE_ANIMS[i] }}
        />
      ))}
      <div
        className="absolute"
        style={{ top: 0, left: 0, width: 2, height: 2, borderRadius: "50%", boxShadow: BRIGHT, animation: "twinkle-bright 7s ease-in-out infinite" }}
      />
      <ShootingStars />
    </div>
  );
}
