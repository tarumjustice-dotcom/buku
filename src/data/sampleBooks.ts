import { Book, PageContent } from '../types/book';

/**
 * Procedural generator for realistic, high-fidelity sample book pages.
 * Renders pages onto high-resolution canvases to ensure zero 404s and razor-sharp text.
 */
export function generateSamplePageCanvas(
  bookTheme: 'architecture' | 'indonesia' | 'cosmos',
  pageIndex: number,
  totalPages: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // High-DPI canvas (width: 1000, height: 1400)
  canvas.width = 1000;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background tone
  if (pageIndex === 0) {
    // Front Cover
    drawCover(ctx, canvas.width, canvas.height, bookTheme, false);
  } else if (pageIndex === totalPages - 1) {
    // Back Cover
    drawCover(ctx, canvas.width, canvas.height, bookTheme, true);
  } else if (pageIndex === 1) {
    // Table of contents
    drawTOC(ctx, canvas.width, canvas.height, bookTheme);
  } else {
    // Interior spread page
    drawContentPage(ctx, canvas.width, canvas.height, bookTheme, pageIndex, totalPages);
  }

  return canvas;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: 'architecture' | 'indonesia' | 'cosmos',
  isBack: boolean
) {
  // Rich background leather / dark cloth gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  if (theme === 'architecture') {
    grad.addColorStop(0, '#1c2321');
    grad.addColorStop(0.5, '#0f1412');
    grad.addColorStop(1, '#050706');
  } else if (theme === 'indonesia') {
    grad.addColorStop(0, '#1c3427');
    grad.addColorStop(0.5, '#0e2017');
    grad.addColorStop(1, '#07120c');
  } else {
    grad.addColorStop(0, '#12132e');
    grad.addColorStop(0.5, '#090a1a');
    grad.addColorStop(1, '#020308');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative gold/bronze outer border
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, w - 104, h - 104);

  // Corner decorative flourishes
  const corners = [
    [40, 40],
    [w - 40, 40],
    [40, h - 40],
    [w - 40, h - 40],
  ];
  corners.forEach(([x, y]) => {
    ctx.fillStyle = '#c5a059';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  if (isBack) {
    // Back cover
    ctx.fillStyle = '#e8d8b8';
    ctx.textAlign = 'center';
    ctx.font = '600 24px "Cinzel", Georgia, serif';
    ctx.fillText('EDISI KOLEKTOR EKSKLUSIF', w / 2, 600);

    ctx.font = 'italic 18px "Lora", Georgia, serif';
    ctx.fillStyle = 'rgba(232, 216, 184, 0.75)';
    ctx.fillText('Dipublikasikan dengan teknologi FlipHTML5 & Three.js 3D', w / 2, 650);
    ctx.fillText('Interaksi realistis dengan simulasi lekukan kertas digital.', w / 2, 680);

    // Barcode / emblem placeholder
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(w / 2 - 80, 800, 160, 2);
    ctx.font = '14px "Inter", sans-serif';
    ctx.fillText('ISBN 978-0-14198-842-1', w / 2, 840);
    return;
  }

  // Geometric abstract artwork on front cover
  drawCoverEmblem(ctx, w, h, theme);

  // Typography
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c5a059';
  ctx.font = '600 20px "Cinzel", serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('PUBLIKASI EDISI KHUSUS', w / 2, 240);

  // Main Title
  ctx.font = '700 52px "Cinzel", Georgia, serif';
  ctx.fillStyle = '#f8ecd5';
  ctx.shadowColor = 'rgba(197, 160, 89, 0.6)';
  ctx.shadowBlur = 12;

  let title = 'LUMINA';
  let subtitle = 'Masterpieces of Modern Architecture';
  let author = 'ARCHITECTURAL DESIGN INSTITUTE';

  if (theme === 'indonesia') {
    title = 'PESONA NUSANTARA';
    subtitle = 'Eksplorasi Keindahan Alam & Budaya Indonesia';
    author = 'TIM KURATOR WARISAN NUSANTARA';
  } else if (theme === 'cosmos') {
    title = 'KOSMOS & KUANTUM';
    subtitle = 'Menjelajahi Batas Cakrawala Semesta & AI';
    author = 'INSTITUT ASTROFISIKA MODERN';
  }

  ctx.fillText(title, w / 2, 420);
  ctx.shadowBlur = 0;

  ctx.font = 'italic 24px "Lora", Georgia, serif';
  ctx.fillStyle = '#e5cca0';
  ctx.fillText(subtitle, w / 2, 480);

  // Thin separator
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 120, 520);
  ctx.lineTo(w / 2 + 120, 520);
  ctx.stroke();

  // Author & Year
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(232, 216, 184, 0.85)';
  ctx.fillText(author, w / 2, 1180);
  ctx.font = '14px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(197, 160, 89, 0.7)';
  ctx.fillText('FLIPBOOK DIGITAL INTERAKTIF • 2026', w / 2, 1220);
}

function drawCoverEmblem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: 'architecture' | 'indonesia' | 'cosmos'
) {
  const cx = w / 2;
  const cy = 760;

  ctx.save();
  if (theme === 'architecture') {
    // Sacred geometry / architectural axonometric wireframe
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.lineWidth = 2;
    for (let r = 60; r <= 180; r += 40) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Rhombus grid
    ctx.beginPath();
    ctx.moveTo(cx, cy - 180);
    ctx.lineTo(cx + 180, cy);
    ctx.lineTo(cx, cy + 180);
    ctx.lineTo(cx - 180, cy);
    ctx.closePath();
    ctx.stroke();
  } else if (theme === 'indonesia') {
    // Batik mandala / floral compass
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.ellipse(
        cx + Math.cos(angle) * 70,
        cy + Math.sin(angle) * 70,
        80,
        35,
        angle,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
  } else {
    // Planetary rings & orbits
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 190, 75, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(197, 160, 89, 0.15)';
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawTOC(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: 'architecture' | 'indonesia' | 'cosmos'
) {
  // Ivory warm page background
  ctx.fillStyle = '#faf7f0';
  ctx.fillRect(0, 0, w, h);

  // Subtle paper grain vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, 800);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(180, 160, 130, 0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8c6e3b';
  ctx.font = '600 16px "Cinzel", serif';
  ctx.fillText('DAFTAR ISI & STRUKTUR BUKU', w / 2, 160);

  ctx.fillStyle = '#1e1c19';
  ctx.font = '700 42px "Playfair Display", Georgia, serif';
  ctx.fillText('Daftar Isi', w / 2, 220);

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 80, 250);
  ctx.lineTo(w / 2 + 80, 250);
  ctx.stroke();

  // TOC items
  const items =
    theme === 'indonesia'
      ? [
          { ch: '01', title: 'Raja Ampat: Permata Bahari Zamrud', page: '04' },
          { ch: '02', title: 'Gunung Bromo: Eksotisme Lautan Pasir', page: '06' },
          { ch: '03', title: 'Ubud Bali: Pesona Seni & Spiritualitas', page: '08' },
          { ch: '04', title: 'Taman Nasional Komodo: Warisan Purba', page: '10' },
          { ch: '05', title: 'Arsitektur Toraja: Tongkonan Sakral', page: '12' },
          { ch: '06', title: 'Jalur Kopi Nusantara: Aroma Kepulauan', page: '14' },
        ]
      : theme === 'cosmos'
      ? [
          { ch: '01', title: 'Cakrawala Awal: Potret James Webb', page: '04' },
          { ch: '02', title: 'Misteri Lubang Hitam & Gravitasi', page: '06' },
          { ch: '03', title: 'Lompatan Komputasi Kuantum', page: '08' },
          { ch: '04', title: 'Kecerdasan Buatan & Batas Kesadaran', page: '10' },
          { ch: '05', title: 'Kolonisasi Mars & Habitat Mandiri', page: '12' },
          { ch: '06', title: 'Starlight & Masa Depan Peradaban', page: '14' },
        ]
      : [
          { ch: '01', title: 'Evolusi Bentuk Parametrik Modern', page: '04' },
          { ch: '02', title: 'Materialitas Titanium & Kaca Lengkung', page: '06' },
          { ch: '03', title: 'Brutalisme: Kemurnian Beton Ekspos', page: '08' },
          { ch: '04', title: 'Gedung Kayu Ramah Lingkungan Masa Depan', page: '10' },
          { ch: '05', title: 'Filosofi Cahaya Alami & Ruang Kosong', page: '12' },
          { ch: '06', title: 'Desain Biofilik & Harmoni Kota Hijau', page: '14' },
        ];

  ctx.textAlign = 'left';
  let startY = 360;
  items.forEach((item) => {
    // Chapter number
    ctx.font = '600 20px "Cinzel", serif';
    ctx.fillStyle = '#b38c4c';
    ctx.fillText(item.ch, 140, startY);

    // Title
    ctx.font = '500 22px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#22201d';
    ctx.fillText(item.title, 200, startY);

    // Dot leader
    ctx.strokeStyle = 'rgba(100, 90, 80, 0.3)';
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(680, startY - 5);
    ctx.lineTo(800, startY - 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Page
    ctx.font = '600 20px "Cinzel", serif';
    ctx.fillStyle = '#8c6e3b';
    ctx.fillText(item.page, 820, startY);

    startY += 110;
  });

  // Footer page number
  ctx.textAlign = 'center';
  ctx.font = '14px "Lora", serif';
  ctx.fillStyle = '#888';
  ctx.fillText('— 2 —', w / 2, 1330);
}

function drawContentPage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: 'architecture' | 'indonesia' | 'cosmos',
  pageIndex: number,
  totalPages: number
) {
  // Editorial layout ivory background
  ctx.fillStyle = '#fcfaf5';
  ctx.fillRect(0, 0, w, h);

  // Subtle spine shadow indicator
  const isLeftPage = pageIndex % 2 === 0;
  const spineGrad = ctx.createLinearGradient(
    isLeftPage ? w - 40 : 0,
    0,
    isLeftPage ? w : 40,
    0
  );
  spineGrad.addColorStop(0, isLeftPage ? 'transparent' : 'rgba(0,0,0,0.08)');
  spineGrad.addColorStop(1, isLeftPage ? 'rgba(0,0,0,0.08)' : 'transparent');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(isLeftPage ? w - 40 : 0, 0, 40, h);

  // Header band
  ctx.font = '600 13px "Cinzel", serif';
  ctx.fillStyle = '#9b8460';
  ctx.textAlign = isLeftPage ? 'left' : 'right';
  const headerX = isLeftPage ? 100 : w - 100;
  ctx.fillText(
    theme === 'indonesia'
      ? 'PESONA NUSANTARA • EDISI KHUSUS'
      : theme === 'cosmos'
      ? 'KOSMOS & KUANTUM • SAINS POPULER'
      : 'LUMINA ARCHITECTURAL ESSAYS',
    headerX,
    100
  );

  ctx.strokeStyle = '#e6ddcc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 115);
  ctx.lineTo(w - 100, 115);
  ctx.stroke();

  // Page titles and content based on pageIndex
  const articleInfo = getArticleForPage(theme, pageIndex);

  // Section / Tag
  ctx.textAlign = 'left';
  ctx.fillStyle = '#b38c4c';
  ctx.font = '600 14px "Cinzel", serif';
  ctx.fillText(`BAB ${Math.ceil(pageIndex / 2)} • ${articleInfo.category.toUpperCase()}`, 100, 180);

  // Main Headline
  ctx.font = '700 38px "Playfair Display", Georgia, serif';
  ctx.fillStyle = '#1c1b18';
  ctx.fillText(articleInfo.title, 100, 235);

  // Subtitle
  ctx.font = 'italic 20px "Lora", Georgia, serif';
  ctx.fillStyle = '#665f54';
  ctx.fillText(articleInfo.subtitle, 100, 280);

  // Feature Illustration Box
  drawPageVisual(ctx, 100, 320, w - 200, 480, theme, pageIndex);

  // Body text columns
  ctx.font = '16px "Lora", Georgia, serif';
  ctx.fillStyle = '#2b2723';
  const colWidth = (w - 240) / 2;
  const col1X = 100;
  const col2X = 100 + colWidth + 40;

  // Render multi-line paragraphs
  drawWrappedText(ctx, articleInfo.paragraph1, col1X, 850, colWidth, 28);
  drawWrappedText(ctx, articleInfo.paragraph2, col2X, 850, colWidth, 28);

  // Pull Quote or Key Insight Card
  ctx.fillStyle = '#f3ede1';
  ctx.fillRect(100, 1120, w - 200, 120);
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 1120);
  ctx.lineTo(100, 1240);
  ctx.stroke();

  ctx.font = 'italic 18px "Playfair Display", serif';
  ctx.fillStyle = '#2c251d';
  drawWrappedText(ctx, `"${articleInfo.quote}"`, 130, 1160, w - 260, 28);

  // Page footer
  ctx.textAlign = 'center';
  ctx.font = '500 15px "Cinzel", serif';
  ctx.fillStyle = '#7a7060';
  ctx.fillText(`— ${pageIndex} —`, w / 2, 1340);
}

function drawPageVisual(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: 'architecture' | 'indonesia' | 'cosmos',
  pageIndex: number
) {
  // Rounded picture frame
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Gradient backdrop
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (theme === 'architecture') {
    grad.addColorStop(0, '#2e3834');
    grad.addColorStop(0.5, '#475852');
    grad.addColorStop(1, '#1b2320');
  } else if (theme === 'indonesia') {
    grad.addColorStop(0, '#1a4b56');
    grad.addColorStop(0.5, '#2f8576');
    grad.addColorStop(1, '#e3a857');
  } else {
    grad.addColorStop(0, '#0d1527');
    grad.addColorStop(0.5, '#231d45');
    grad.addColorStop(1, '#4e2553');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Procedural geometric graphics inside
  if (theme === 'architecture') {
    // Elegant modern facade lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 60, y + h);
      ctx.lineTo(x + i * 40 + 100, y);
      ctx.stroke();
    }
    // Bold accent cantilever
    ctx.fillStyle = 'rgba(230, 190, 120, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 80, y + 260);
    ctx.lineTo(x + w - 120, y + 180);
    ctx.lineTo(x + w - 80, y + 360);
    ctx.lineTo(x + 120, y + 420);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f4e0ba';
    ctx.stroke();
  } else if (theme === 'indonesia') {
    // Island silhouettes & emerald waters
    ctx.fillStyle = 'rgba(20, 120, 100, 0.6)';
    ctx.beginPath();
    ctx.arc(x + 220, y + 300, 180, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = 'rgba(235, 175, 80, 0.7)';
    ctx.beginPath();
    ctx.arc(x + w - 240, y + 160, 60, 0, Math.PI * 2);
    ctx.fill();

    // Ocean waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(x, y + 360 + r * 30);
      ctx.bezierCurveTo(
        x + w * 0.3,
        y + 340 + r * 30,
        x + w * 0.7,
        y + 380 + r * 30,
        x + w,
        y + 350 + r * 30
      );
      ctx.stroke();
    }
  } else {
    // Nebulae and quantum glowing rings
    ctx.strokeStyle = 'rgba(180, 140, 255, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 6; i++) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, i * 45, i * 25, (pageIndex * 0.4), 0, Math.PI * 2);
      ctx.stroke();
    }
    // Core glow
    const coreGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, 90);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#f59e0b');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Frame border
  ctx.strokeStyle = '#d5c4aa';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Caption
  ctx.textAlign = 'right';
  ctx.font = 'italic 13px "Lora", serif';
  ctx.fillStyle = '#7a7060';
  ctx.fillText('Figur ' + pageIndex + '.1: Representasi Visual Edisi Kuratorial', x + w, y + h + 22);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

function getArticleForPage(
  theme: 'architecture' | 'indonesia' | 'cosmos',
  pageIndex: number
) {
  if (theme === 'indonesia') {
    const list = [
      {
        category: 'Ekosistem Bahari',
        title: 'Raja Ampat: Surga Bawah Laut',
        subtitle: 'Kekayaan 75% Spesies Terumbu Karang Dunia',
        paragraph1:
          'Gugusan empat pulau utama di kepala burung Papua Barat ini menyimpan keajaiban biodiversitas laut terkaya di planet Bumi. Air biru toska yang jernih membentang di sela-sela tebing karst megah.',
        paragraph2:
          'Kearifan lokal sistem "Sasi" menjaga kelestarian ekosistem karang dari eksploitasi, membuktikan bagaimana harmoni antara manusia dan alam laut dapat diwariskan lintas generasi.',
        quote: 'Raja Ampat bukan sekadar destinasi, melainkan ruang suci keanekaragaman hayati khatulistiwa.',
      },
      {
        category: 'Geologi Purba',
        title: 'Bromo: Simfoni Pasir & Kabut',
        subtitle: 'Matahari Terbit di Kaldera Tengger',
        paragraph1:
          'Lautan pasir seluas 5.250 hektar di ketinggian 2.329 mdpl ini menghadirkan bentang alam magis. Saat fajar menyingsing, kabut putih menyelimuti lembah seperti samudra awan.',
        paragraph2:
          'Upacara Yadnya Kasada oleh masyarakat suku Tengger menjadi ritual sakral penyerahan sesaji ke kawah aktif, melambangkan rasa syukur yang mendalam atas karunia kehidupan.',
        quote: 'Di antara kawah yang bergemuruh, keheningan spiritual menyatu dengan keagungan semesta.',
      },
      {
        category: 'Kesenian & Jiwa',
        title: 'Ubud: Pusat Denyut Seni Bali',
        subtitle: 'Filosofi Tri Hita Karana dalam Ruang Hidup',
        paragraph1:
          'Dikelilingi terasering sawah hijau zamrud dan lembah sungai Ayung, Ubud adalah laboratorium kebudayaan di mana seni lukis, tari sakral, dan ukiran kayu menjadi bagian ibadah harian.',
        paragraph2:
          'Bangunan pura dengan gerbang candi bentar terbuat dari bata merah dan batu paras hitam berdiri anggun, merefleksikan estetika arsitektur tradisional Bali yang abadi.',
        quote: 'Kreativitas di Ubud tidak diciptakan untuk dipamerkan, melainkan dihidupkan sebagai doa.',
      },
    ];
    return list[(pageIndex - 2) % list.length];
  } else if (theme === 'cosmos') {
    const list = [
      {
        category: 'Astrofisika',
        title: 'Mata Webb: Mengintip Bayi Galaksi',
        subtitle: 'Fajar Kosmik 13,5 Miliar Tahun Lalu',
        paragraph1:
          'Teleskop Luar Angkasa James Webb membuka jendela baru bagi peradaban manusia dengan mendeteksi cahaya inframerah dari galaksi-galaksi purba pertama yang lahir setelah dentuman besar.',
        paragraph2:
          'Cermin heksagonal berlapis emas setebal 100 nanometer mampu menangkap foton redup yang telah menempuh perjalanan miliaran tahun melintasi ruang hampa semesta.',
        quote: 'Setiap citra bintang yang kita lihat malam ini adalah rekaman masa lalu yang menatap kita kembali.',
      },
      {
        category: 'Kuantum Komputasi',
        title: 'Superposisi & Lompatan Qubit',
        subtitle: 'Melampaui Batas Logika Komputer Biner Klasik',
        paragraph1:
          'Komputasi kuantum memanfaatkan fenomena jalinan kuantum (entanglement) dan superposisi untuk menyelesaikan kalkulasi eksponensial dalam hitungan detik.',
        paragraph2:
          'Mulai dari pemodelan molekuler untuk obat-obatan baru hingga simulasi material superkonduktor suhu ruang, lompatan teknologi ini akan mendefinisikan abad ke-21.',
        quote: 'Di alam kuantum, sebuah partikel dapat berada di berbagai tempat sekaligus sampai kita mengamatinya.',
      },
    ];
    return list[(pageIndex - 2) % list.length];
  } else {
    const list = [
      {
        category: 'Parametric Design',
        title: 'Geometri Fluida & Masa Depan',
        subtitle: 'Transformasi Arsitektur Digital Kontemporer',
        paragraph1:
          'Arsitektur abad ke-21 menolak batasan kotak ortogonal. Dengan algoritma parametrik komputasi, struktur bangunan kini dapat mengalir secara organik menyerupai formasi alam.',
        paragraph2:
          'Pemanfaatan baja komposit dan panel titanium melengkung ganda memungkinkan perwujudan ruang tanpa pilar masif di dalam atrium tengah, memaksimalkan pencahayaan pasif.',
        quote: 'Bangunan bukan lagi sekadar pelindung dari cuaca, melainkan patung raksasa yang bernapas bersama kota.',
      },
      {
        category: 'Materialitas',
        title: 'Keanggunan Brutalisme Baru',
        subtitle: 'Kejujuran Tekstur Beton & Cahaya Dramatis',
        paragraph1:
          'Brutalisme terlahir kembali dengan presisi modern. Tekstur serat papan kayu yang tercetak pada permukaan beton ekspos memberikan sentuhan tactile yang hangat dan manusiawi.',
        paragraph2:
          'Integrasi celah skylight tersembunyi menciptakan permainan bayangan dramatis yang terus bergerak sepanjang hari, mengubah ruang statis menjadi pengalaman spasial dinamis.',
        quote: 'Cahaya tidak akan bermakna tanpa kehadiran bayangan yang memberi bentuk pada keheningan ruang.',
      },
    ];
    return list[(pageIndex - 2) % list.length];
  }
}

/**
 * Creates pre-configured sample books with rendered page canvases.
 */
export function getSampleBooks(): Book[] {
  return [
    createSampleBookConfig(
      'arch-mag',
      'Lumina: Masterpieces of Architecture',
      'Architectural Design Institute',
      'Majalah kuratorial arsitektur modern dengan esai desain parametrik, kejujuran beton brutalist, dan estetika cahaya.',
      'architecture',
      12,
      [
        { title: 'Cover Depan', pageNumber: 1 },
        { title: 'Daftar Isi & Struktur', pageNumber: 2 },
        { title: 'Bab 1: Evolusi Bentuk Parametrik', pageNumber: 3 },
        { title: 'Bab 1: Struktur & Analisis Spasial', pageNumber: 4 },
        { title: 'Bab 2: Kejujuran Tekstur Beton', pageNumber: 5 },
        { title: 'Bab 2: Estetika Skylight & Cahaya', pageNumber: 6 },
        { title: 'Bab 3: Gedung Kayu Masa Depan', pageNumber: 7 },
        { title: 'Bab 3: Sirkulasi Udara Biofilik', pageNumber: 8 },
        { title: 'Bab 4: Paviliun Minimalis Kontemporer', pageNumber: 9 },
        { title: 'Bab 4: Eksplorasi Material Komposit', pageNumber: 10 },
        { title: 'Koleksi Foto & Galeri', pageNumber: 11 },
        { title: 'Cover Belakang & Kolofon', pageNumber: 12 },
      ]
    ),
    createSampleBookConfig(
      'indo-travel',
      'Pesona Nusantara: Zamrud Khatulistiwa',
      'Tim Kurator Warisan Nusantara',
      'Buku fotografi dan narasi keindahan lanskap alam, kearifan budaya lokal, dan warisan kepulauan Indonesia.',
      'indonesia',
      10,
      [
        { title: 'Sampul Buku', pageNumber: 1 },
        { title: 'Daftar Isi', pageNumber: 2 },
        { title: 'Raja Ampat: Surga Bahari Dunia', pageNumber: 3 },
        { title: 'Raja Ampat: Tradisi Sasi Laut', pageNumber: 4 },
        { title: 'Gunung Bromo: Kaldera Mistis', pageNumber: 5 },
        { title: 'Bromo: Ritual Suci Kasada', pageNumber: 6 },
        { title: 'Ubud Bali: Jantung Seni & Spiritualitas', pageNumber: 7 },
        { title: 'Ubud Bali: Harmoni Tri Hita Karana', pageNumber: 8 },
        { title: 'Rangkuman Perjalanan', pageNumber: 9 },
        { title: 'Sampul Belakang', pageNumber: 10 },
      ]
    ),
    createSampleBookConfig(
      'cosmos-quantum',
      'Kosmos & Kuantum: Cakrawala Sains',
      'Institut Astrofisika Modern',
      'Eksplorasi batas mutakhir teleskop James Webb, misteri jalinan kuantum, dan kecerdasan artifisial masa depan.',
      'cosmos',
      8,
      [
        { title: 'Sampul Depan', pageNumber: 1 },
        { title: 'Daftar Isi', pageNumber: 2 },
        { title: 'Fajar Kosmik James Webb', pageNumber: 3 },
        { title: 'Deteksi Inframerah Purba', pageNumber: 4 },
        { title: 'Revolusi Komputasi Kuantum', pageNumber: 5 },
        { title: 'Jalinan Superposisi Partikel', pageNumber: 6 },
        { title: 'Masa Depan AI & Kesadaran', pageNumber: 7 },
        { title: 'Sampul Belakang', pageNumber: 8 },
      ]
    ),
  ];
}

function createSampleBookConfig(
  id: string,
  title: string,
  author: string,
  description: string,
  theme: 'architecture' | 'indonesia' | 'cosmos',
  totalPages: number,
  toc: { title: string; pageNumber: number }[]
): Book {
  const pages: PageContent[] = [];

  for (let i = 0; i < totalPages; i++) {
    const pageCanvas = generateSamplePageCanvas(theme, i, totalPages);
    pages.push({
      pageNumber: i + 1,
      title: toc[i]?.title || `Halaman ${i + 1}`,
      renderedCanvas: pageCanvas,
      imageUrl: pageCanvas.toDataURL('image/jpeg', 0.92),
      isCover: i === 0,
      isBackCover: i === totalPages - 1,
      textSnippet: `Halaman ${i + 1}: ${title} - ${toc[i]?.title || ''}`,
    });
  }

  return {
    id,
    title,
    author,
    description,
    coverImage: pages[0].imageUrl,
    totalPages,
    pages,
    toc,
    themeColor: theme === 'indonesia' ? '#10b981' : theme === 'cosmos' ? '#8b5cf6' : '#d97706',
  };
}
