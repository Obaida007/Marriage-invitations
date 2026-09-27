import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { THEME_LIST } from "@/lib/themes";
import { FONTS } from "@/lib/fonts-meta";

const FEATURES = [
  { icon: "🔗", title: "دعوة على شكل رابط", text: "صفحة ويب أنيقة تفتح على أي جوال، مع معاينة جميلة عند مشاركتها في واتساب." },
  { icon: "👤", title: "رابط شخصي لكل ضيف", text: "يرى كل ضيف اسمه وعدد المقاعد المخصصة له، ويرتبط رده ببطاقته تلقائياً." },
  { icon: "✅", title: "تأكيد الحضور", text: "الضيف يؤكد أو يعتذر مع عدد المرافقين، وأنت تتابع الردود لحظياً." },
  { icon: "🎫", title: "بطاقة دخول QR", text: "بعد التأكيد يحصل الضيف على رمز دخول، وتمسحه عند باب القاعة من جوالك." },
  { icon: "⏳", title: "عدّاد تنازلي", text: "عدّ تنازلي حي لليلة العمر بتوقيت مكان الحفل بدقة لأي ضيف في أي دولة." },
  { icon: "🌙", title: "التاريخ الهجري والميلادي", text: "يُعرض التاريخ بالتقويمين (أم القرى) بالأرقام العربية." },
  { icon: "📍", title: "الموقع والتقويم", text: "خريطة مدمجة وزر اتجاهات، وإضافة الموعد إلى تقويم Google وApple بضغطة." },
  { icon: "🎶", title: "موسيقى وظرف متحرك", text: "ظرف يُفتح بلمسة مع ختم الشمع وموسيقى خلفية من اختيارك." },
  { icon: "💌", title: "دفتر التهاني", text: "يكتب الضيوف تهانيهم وتظهر في الدعوة، مع إمكانية الإخفاء والحذف." },
  { icon: "👨‍👩‍👧", title: "حفلات متعددة", text: "حفل الرجال والنساء والملكة والحناء في دعوة واحدة، لكل منها موعد ومكان." },
  { icon: "📊", title: "لوحة تحكم كاملة", text: "إضافة الضيوف دفعة واحدة، إرسال عبر واتساب، وتصدير القائمة إلى Excel." },
  { icon: "🎥", title: "خلفية صورة أو فيديو", text: "صورة أو فيديو قصير خلف القسم الأول أو خلف الدعوة كاملة، مع التحكم بالشفافية والتمويه." },
  { icon: "🎲", title: "تصميم لا يتكرر", text: "٥ تخطيطات وأشكال للتاريخ والعدّاد والبطاقات، وزر «فاجئني» يولّد تصميماً فريداً بضغطة." },
  { icon: "🔒", title: "حساب خاص لكل مناسبة", text: "مستخدمان لكل دعوة يديرانها ويتابعان الردود، مع قفل تاريخ المناسبة وأرشفتها تلقائياً بعد انتهائها." },
];

// Set NEXT_PUBLIC_ORDER_WHATSAPP (international format) to take orders on WhatsApp.
const ORDER_PHONE = process.env.NEXT_PUBLIC_ORDER_WHATSAPP?.replace(/[^\d]/g, "");
const ORDER_URL = ORDER_PHONE ? `https://wa.me/${ORDER_PHONE}?text=${encodeURIComponent("السلام عليكم، أرغب بطلب دعوة زفاف إلكترونية")}` : "/login";
const ORDER_PROPS = ORDER_PHONE ? { target: "_blank", rel: "noopener noreferrer" } : {};

const STEPS = [
  { n: "١", title: "اطلب دعوتك", text: "نجهّز مناسبتك بتاريخها ونسلّمك حساب الدخول، ثم تخصّص التصميم كما تحب بمعاينة مباشرة." },
  { n: "٢", title: "أضف ضيوفك", text: "الصق قائمة الأسماء وأرقام الجوال لتحصل على رابط شخصي لكل ضيف." },
  { n: "٣", title: "أرسل وتابع", text: "أرسل عبر واتساب بضغطة، وتابع الردود وامسح بطاقات الدخول يوم الحفل." },
];

export default function Home() {
  return (
    <>
      <SiteHeader>
        <Link href="/login" className="btn-ghost">
          تسجيل الدخول
        </Link>
        <a href={ORDER_URL} className="btn-primary hidden sm:inline-flex" {...ORDER_PROPS}>
          اطلب دعوتك
        </a>
      </SiteHeader>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 start-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl rtl:translate-x-1/2" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="text-center lg:text-start">
              <span className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-sm text-brand-dark">💍 دعوات زفاف إلكترونية باللغة العربية</span>
              <h1 className="mt-6 font-display text-5xl leading-[1.3] text-stone-800 sm:text-6xl">
                دعوة زفافك،
                <br />
                <span className="text-brand">برابط واحد أنيق</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-stone-600 lg:mx-0">
                أنشئ دعوة زفاف تفاعلية في دقائق: ظرف متحرك، عدّاد تنازلي، موقع الحفل، تأكيد حضور، رابط شخصي باسم كل ضيف، وبطاقة دخول QR — وتديرها بحسابك الخاص.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a href={ORDER_URL} {...ORDER_PROPS} className="btn-primary px-7 py-3.5 text-base">
                  اطلب دعوتك الآن ✨
                </a>
                <Link href="/demo/royal-gold" className="btn-ghost px-7 py-3.5 text-base">
                  شاهد مثالاً حياً
                </Link>
              </div>
            </div>

            {/* Phone mock */}
            <div className="relative mx-auto w-[290px] sm:w-[320px]">
              <div className="rounded-[2.75rem] border-[10px] border-stone-900 bg-[#fbf7ef] p-6 text-center shadow-2xl shadow-brand/20" style={{ color: "#3b2f1e" }}>
                <p className="font-amiri text-sm text-[#8a7456]">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                <p className="mt-6 font-amiri text-sm">يتشرف آل عبدالله وآل إبراهيم بدعوتكم</p>
                <div className="my-5 text-[#b08d57]">✦ ✦ ✦</div>
                <p className="font-display text-5xl text-[#b08d57]">محمد</p>
                <p className="my-2 font-display text-2xl text-[#b08d57]">و</p>
                <p className="font-display text-5xl text-[#b08d57]">سارة</p>
                <div className="mt-6 flex items-center justify-center gap-3 font-amiri">
                  <span className="border-y border-[#b08d57]/50 px-2 py-1 text-sm">الخميس</span>
                  <span className="font-display text-4xl text-[#b08d57]">١٥</span>
                  <span className="border-y border-[#b08d57]/50 px-2 py-1 text-sm">شوال</span>
                </div>
                <div className="mt-6 grid grid-cols-4 gap-1.5">
                  {["٤٥", "١٢", "٣٠", "٠٨"].map((v, i) => (
                    <div key={i} className="rounded-xl border border-[#e3d3b3] bg-white/60 py-2">
                      <div className="font-display text-xl text-[#b08d57]">{v}</div>
                      <div className="text-[9px] text-[#8a7456]">{["يوم", "ساعة", "دقيقة", "ثانية"][i]}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-full bg-[#b08d57] py-2.5 text-sm font-bold text-white">تأكيد الحضور</div>
              </div>
              <div className="absolute -start-10 top-24 hidden rotate-[-6deg] rounded-2xl bg-white px-4 py-3 text-sm shadow-xl sm:block">
                ✅ <b>أبو فهد</b> أكد حضور ٣ أشخاص
              </div>
              <div className="absolute -end-8 bottom-24 hidden rotate-[5deg] rounded-2xl bg-white px-4 py-3 text-sm shadow-xl sm:block">
                💌 تهنئة جديدة من <b>أم سعد</b>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="features">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl text-stone-800">كل ما تحتاجه دعوتك</h2>
            <p className="mt-3 text-stone-600">مستوحاة من أفضل منصات الدعوات الرقمية، ومصممة للعادات والذوق العربي.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft text-2xl">{f.icon}</div>
                <h3 className="mt-4 font-bold text-stone-800">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Themes */}
        <section className="bg-white/60 py-16" id="templates">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl text-stone-800">قوالب بطابع عربي أصيل</h2>
              <p className="mt-3 text-stone-600">اختر القالب ثم خصص الألوان والخطوط العربية كما تحب. اضغط على أي قالب لمعاينته كاملاً.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_LIST.map((th) => (
                <Link key={th.id} href={`/demo/${th.id}`} className="group overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative flex h-52 flex-col items-center justify-center" style={{ background: th.colors.bg, color: th.colors.accent }}>
                    <span className="absolute inset-4 rounded-2xl border" style={{ borderColor: th.colors.border }} />
                    <span className="text-5xl" style={{ fontFamily: FONTS[th.headingFont].cssVar }}>
                      محمد و سارة
                    </span>
                    <span className="mt-3 text-sm" style={{ color: th.colors.muted, fontFamily: FONTS[th.bodyFont].cssVar }}>
                      الخميس ١٥ شوال ١٤٤٨ هـ
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-bold">{th.name}</div>
                      <div className="text-sm text-stone-500">{th.description}</div>
                    </div>
                    <span className="text-sm font-bold text-brand opacity-0 transition group-hover:opacity-100">معاينة ←</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-4xl text-stone-800">ثلاث خطوات فقط</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand font-display text-2xl text-white">{s.n}</div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-stone-600">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a href={ORDER_URL} {...ORDER_PROPS} className="btn-primary px-8 py-4 text-base">
              اطلب دعوتك
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-stone-500">صُنع بحب للأفراح العربية 🤍 · دعوتي</footer>
    </>
  );
}
