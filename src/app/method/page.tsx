"use client";
import { useEffect, useState } from "react";
import Header from "@/app/_components/header";
import { isMobileDevice } from "../_components/mobile-detector";
import '@/app/globals.css';
import Footer from "../_components/footer";
import $ from 'jquery';

export default function Index() {
    const [language, setLanguage] = useState<string>("en");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

    useEffect(() => {
        $('img').on('click', function () {
            const overlay = $('#media-overlay');
            const overlayContent = $('#overlay-content');
            // Clear previous content
            overlayContent.empty();
            const imgSrc = $(this).attr('src');
            overlayContent.append(`<img src="${imgSrc}" class="w-full h-full object-contain" />`);
            // Show the overlay
            overlay.removeClass('fade-out').addClass('fade-in');
        });

        // Close overlay
        $('#close-overlay, #media-overlay').on('click', function (e) {
            if (e.target.id === 'media-overlay' || e.target.id === 'close-overlay') {
                $('#media-overlay').removeClass('fade-in').addClass('fade-out');
            }
        });

        // Clean up event listeners
        return () => {
            $('img').off('click');
            $('#close-overlay, #media-overlay').off('click');
        };
    })



    return (
        <div>
            <Header TypewriterFinished={false} />

            {/* media overlay */}
            <div id="media-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div id="overlay-content" className="border-2 flex justify-center items-center"></div>
            </div>

            <main className={`method-page h-[95vh] overflow-scroll min-h-screen ${isMobile ? "block mt-20 mx-3" : "flex justify-center"}`}>
                <div className={`relative ${isMobile ? "mt-10 mx-0 w-100" : "mt-32 mx-20 w-[60vw] h-max"} text-white block`}>

                    {/* language select  */}
                    <div className='relative block mb-6 text-white cursor-pointer'>
                        <span
                            className={`transition-colors ${language === "en" ? "text-white underline" : "text-gray-400 no-underline"}`}
                            onClick={() => { setLanguage("en") }}
                        >English </span>
                        &nbsp;/&nbsp;
                        <span
                            className={`transition-colors ${language === "ar" ? "text-white underline" : "text-gray-400 no-underline"}`}
                            onClick={() => { setLanguage("ar"); }}
                        >   العربية</span>
                    </div>

                    <div className={`en absolute transition-opacity duration-200 ${language === "en" ? "opacity-100 visible" : "opacity-0 invisible hidden"}`}>
                        <h2 className="mb-10">Methodology</h2>
                        <p className="intro">
                            Every incident in this archive is built from material anyone can look at,
                            and every step below can be repeated by someone else. What follows is how a
                            piece of footage becomes a dot on the map: where I find it, how I satisfy
                            myself it shows white phosphorus and not something else, and how I fix
                            where and when it happened.
                        </p>

                        <section>
                            <h3>Data Collection</h3>
                            <p>
                                I build the dataset from what is published openly. I monitor social
                                platforms &mdash; X (Twitter), Facebook, Instagram and Telegram &mdash;
                                along with Lebanese and international news outlets, for footage of white
                                phosphorus over South Lebanon.
                            </p>
                            <p>
                                I also search the wire agencies&rsquo; photo archives. Agency
                                photographers often cover the same strike from a second position, which
                                gives me an independent angle on an event first seen in a phone video:{" "}
                                <a href="https://www.gettyimages.com/" target="_blank" rel="noopener noreferrer">Getty&nbsp;Images</a>,{" "}
                                <a href="https://www.afpforum.com/" target="_blank" rel="noopener noreferrer">AFP&nbsp;Forum</a>,{" "}
                                <a href="https://www.anpfoto.nl/" target="_blank" rel="noopener noreferrer">ANP</a> and{" "}
                                <a href="https://www.anadoluimages.com/" target="_blank" rel="noopener noreferrer">Anadolu&nbsp;Images</a>.
                                Those photographs are licensed, so I do not reproduce them here. Each
                                incident links out to the source instead, as its publisher posted it.
                            </p>
                        </section>

                        <section>
                            <h3>Munition Identification</h3>
                            <p>
                                Not every white plume is white phosphorus. The munition most often
                                mistaken for it is HC smoke &mdash; a hexachloroethane and zinc mixture
                                &mdash; which armies fire for the same screening purpose. Israeli forces
                                field both: the M825-series white phosphorus projectile and the M150 HC
                                projectile, in the same 155&nbsp;mm calibre and painted almost alike.
                                Mixing the two up is the most common error in reporting on these strikes,
                                so it is the first thing I rule out.
                            </p>
                            <p>
                                The difference is clearest in the first seconds, and it comes down to a
                                number. An M825 carries <strong>116</strong> felt wedges soaked in
                                phosphorus, which ignite on contact with air and fall as burning points
                                trailing white smoke &mdash; the tentacular shape these plumes are known
                                for. An M150 ejects <strong>five</strong> HC canisters, which come to rest
                                and smoulder on the ground. A few
                                minutes later the two clouds can look much the same, which is why I judge
                                the burst and not the aftermath.
                            </p>
                            <p>
                                For the physical and marking differences between the two projectiles I
                                follow Trevor Ball and N.R. Jenzen-Jones,{" "}
                                <a href="https://armamentresearch.com/differentiating-m825-wp-and-m150-hc-smoke-artillery-projectiles/" target="_blank" rel="noopener noreferrer">
                                    Differential identification of M825 WP and M150 HC smoke artillery projectiles
                                </a>{" "}
                                (Armament Research Services, 2024), and the{" "}
                                <a href="https://osmp.ngo/" target="_blank" rel="noopener noreferrer">Open-source Munitions Portal</a>{" "}
                                it draws on, which catalogues photographs of the munitions themselves.
                            </p>

                            <div className="munition-grid">
                                <figure>
                                    <img className="crop-top" src="/about/munition_hc_day.png" alt="HC smoke in daylight" />
                                    <figcaption><span className="munition-tag munition-tag-hc">HC</span> Five canisters. Few enough to count.</figcaption>
                                </figure>
                                <figure>
                                    <img src="/about/munition_hc_night.png" alt="HC smoke at night" />
                                    <figcaption><span className="munition-tag munition-tag-hc">HC</span> The same five, falling on steady trails.</figcaption>
                                </figure>
                                <figure>
                                    <img className="crop-top" src="/about/munition_wp_day.png" alt="White phosphorus in daylight" />
                                    <figcaption><span className="munition-tag munition-tag-wp">WP</span> 116 wedges from a single shell.</figcaption>
                                </figure>
                                <figure>
                                    <img src="/about/munition_wp_night.png" alt="White phosphorus at night" />
                                    <figcaption><span className="munition-tag munition-tag-wp">WP</span> The same 116, burning where they land.</figcaption>
                                </figure>
                            </div>
                            <p>
                                So the count settles it, and the two are nowhere near each other: if the
                                trails can be counted on one hand it is HC, and if they cannot be counted
                                at all it is white phosphorus.
                            </p>

                            <h4>Reading the burst</h4>
                            <p>
                                Once a strike is confirmed as white phosphorus, the same footage tells me
                                how far it spread. Using a landmark of known size in frame &mdash; a
                                building, a road width, a pylon &mdash; I scale the image and measure two
                                things: the altitude the shell burst at, and the width of ground the
                                falling wedges covered.
                            </p>
                            <figure className="burst-figure">
                                <img src="/about/02_dataVerification.jpg" alt="Two white phosphorus bursts measured for altitude and impact width" />
                                <figcaption>
                                    Two bursts over the same village. The left shell opened at roughly
                                    148&nbsp;m and fell close to vertical, covering about 85&nbsp;m of
                                    ground. The right opened lower, at about 82&nbsp;m, but at a steeper
                                    angle, spreading the wedges across more than 105&nbsp;m.
                                </figcaption>
                            </figure>
                            <p>
                                Burst height is not a detail. A shell that opens high scatters its wedges
                                over a wider area, and a steep descent widens it further &mdash; which is
                                why two rounds of the same type can leave very different footprints. These
                                measurements are where the coverage estimate on the map comes from, and
                                why it is given as a range rather than a fixed radius.
                            </p>
                        </section>

                        <section>
                            <h3>Data Verification</h3>
                            <p>
                                Before anything else I check that the footage is not recycled from an
                                earlier war. A{" "}
                                <a href="https://images.google.com/" target="_blank" rel="noopener noreferrer">Google reverse image search</a>{" "}
                                finds the earliest posting of a clip, or of a still taken from it, which
                                usually settles whether it is new.
                            </p>
                            <p>
                                I then cross-reference it against everything else said that day &mdash;
                                Lebanese news agencies and local news pages, and posts from people in the
                                village itself. A strike is rarely its only trace, and where those
                                accounts describe something I have not seen, they often point towards
                                better footage than the clip I started from. Anything that turns out to be
                                older, or from somewhere else, is discarded rather than logged with a
                                caveat.
                            </p>
                        </section>

                        <section>
                            <h3>Geolocation</h3>
                            <p>
                                Geolocation fixes the coordinates of a strike from the footage itself. I
                                work from what is visible in frame &mdash; ridgelines, roads, a minaret, the
                                shape of a built-up edge, the arrangement of greenhouses &mdash; and match
                                those against satellite and street-level imagery until the camera position
                                and the impact point are both accounted for. In practice this means moving
                                between{" "}
                                <a href="https://www.google.com/earth/about/versions/" target="_blank" rel="noopener noreferrer">Google&nbsp;Earth&nbsp;Pro</a>,
                                which carries historical imagery you can step back through, and the higher
                                resolution sources below.
                            </p>
                            <p>
                                A strike I cannot place this way stays in the archive as verified but not
                                yet geolocated: it is counted, and it appears in the totals, but it has no
                                dot on the map until someone pins it down.
                            </p>
                            <img src="/about/03_geolocationChronolocation.jpg" alt="geolocation and chronolocation" />
                        </section>

                        <section>
                            <h3>Chronolocation</h3>
                            <p>
                                Chronolocation tests the claimed date. I compare satellite imagery from
                                before and after the reported day, looking for the burn scarring white
                                phosphorus leaves on open ground. Where the footage shows shadows, their
                                direction and length narrow down the time of day, which I check with{" "}
                                <a href="https://www.suncalc.org/" target="_blank" rel="noopener noreferrer">SunCalc</a>.
                            </p>
                            <p>
                                Two satellite sources do most of this work. The European Union&rsquo;s{" "}
                                <a href="https://browser.dataspace.copernicus.eu/" target="_blank" rel="noopener noreferrer">Copernicus&nbsp;Browser</a>{" "}
                                gives free Sentinel-2 imagery every few days, which is enough to bracket a
                                date even though each pixel covers ten metres. For anything finer I use{" "}
                                <a href="https://www.planet.com/" target="_blank" rel="noopener noreferrer">Planet&nbsp;Labs&nbsp;PBC</a>{" "}
                                imagery, provided under their{" "}
                                <a href="https://www.planet.com/industries/education-and-research/" target="_blank" rel="noopener noreferrer">Education and Research licence</a>,
                                which covers non-commercial academic use and is why this imagery can be
                                shown here at all.
                            </p>
                            <p>
                                This method has real limits, and I would rather state them than imply a
                                precision I do not have. Cloud cover hides the ground. There are days with
                                no usable pass at all. And white phosphorus does not always leave a mark
                                &mdash; in a built-up area, or when it burns out before reaching the ground,
                                there may be nothing to find from orbit even though the strike happened.
                            </p>
                            <div className="grid grid-cols-2 w-full gallery mt-10">
                                <img className="object-cover  w-full" src="/about/Chronolocation1.jpeg" alt="chronolocation_img" />
                                <img className="object-cover w-full " src="/about/Chronolocation2.jpeg" alt="chronolocation_img" />
                                <img className="object-cover w-full" src="/about/Chronolocation3.jpeg" alt="chronolocation_img" />
                                <video className="object-cover w-full h-full" controls={false} autoPlay loop muted>
                                    <source src="/about/Chronolocation4.mp4" type="video/mp4" />
                                </video>
                            </div>
                        </section>

                        <section>
                            <h3>Data Integration and Visualization</h3>
                            <p>
                                Each confirmed incident is logged once in{" "}
                                <a href="https://qgis.org/" target="_blank" rel="noopener noreferrer">QGIS</a>,
                                with its coordinates, date and time, the town it fell in, the kind of
                                ground it hit, who geolocated it, and links to the source media. That
                                single dataset is what the site reads, so the map, the timeline, the
                                charts and the contamination index at the top of every page are all views
                                of the same record and cannot disagree with one another.
                            </p>
                            <p>
                                Because the count is derived rather than typed in, correcting one incident
                                corrects every figure on the site at once.
                            </p>
                        </section>

                        <section>
                            <h3>Tools and Sources</h3>
                            <p>
                                Everything above is linked where it is used. Gathered here as well, so
                                the toolbox can be taken on its own.
                            </p>
                            <ul className="tool-list">
                                <li>
                                    <a href="https://armamentresearch.com/differentiating-m825-wp-and-m150-hc-smoke-artillery-projectiles/" target="_blank" rel="noopener noreferrer">Ball &amp; Jenzen-Jones, M825 WP vs M150 HC</a>
                                    <span className="tool-note">How to tell the two Israeli smoke projectiles apart. ARES, 2024.</span>
                                </li>
                                <li>
                                    <a href="https://osmp.ngo/" target="_blank" rel="noopener noreferrer">Open-source Munitions Portal</a>
                                    <span className="tool-note">Reference photographs of munitions, by ARES and Airwars.</span>
                                </li>
                                <li>
                                    <a href="https://browser.dataspace.copernicus.eu/" target="_blank" rel="noopener noreferrer">Copernicus Browser</a>
                                    <span className="tool-note">Free Sentinel-2 imagery, revisiting every few days. Ten metres per pixel.</span>
                                </li>
                                <li>
                                    <a href="https://www.planet.com/industries/education-and-research/" target="_blank" rel="noopener noreferrer">Planet Education and Research</a>
                                    <span className="tool-note">High-resolution daily imagery under a non-commercial academic licence.</span>
                                </li>
                                <li>
                                    <a href="https://www.suncalc.org/" target="_blank" rel="noopener noreferrer">SunCalc</a>
                                    <span className="tool-note">Sun position and shadow length for a given place and moment.</span>
                                </li>
                                <li>
                                    <a href="https://www.google.com/earth/about/versions/" target="_blank" rel="noopener noreferrer">Google Earth Pro</a>
                                    <span className="tool-note">Historical imagery you can step back through while geolocating.</span>
                                </li>
                                <li>
                                    <a href="https://qgis.org/" target="_blank" rel="noopener noreferrer">QGIS</a>
                                    <span className="tool-note">Where each incident is logged and the dataset behind this site is kept.</span>
                                </li>
                                <li>
                                    <a href="https://images.google.com/" target="_blank" rel="noopener noreferrer">Google reverse image search</a>
                                    <span className="tool-note">Finds the earliest posting of a clip or a still taken from it.</span>
                                </li>
                                <li>
                                    <a href="https://www.gettyimages.com/" target="_blank" rel="noopener noreferrer">Getty Images</a>,{" "}
                                    <a href="https://www.afpforum.com/" target="_blank" rel="noopener noreferrer">AFP Forum</a>,{" "}
                                    <a href="https://www.anpfoto.nl/" target="_blank" rel="noopener noreferrer">ANP</a>,{" "}
                                    <a href="https://www.anadoluimages.com/" target="_blank" rel="noopener noreferrer">Anadolu Images</a>
                                    <span className="tool-note">Wire photo archives, searched alongside the social platforms.</span>
                                </li>
                            </ul>
                        </section>

                        <hr className="mb-10" />
                        <section className="method-contact mt-32 mb-32">If you have additional footage you would like to share, please reach out to me at a.b.baydoun@tudelft.nl.</section>
                    </div>

                    <div className={`ar absolute transition-opacity duration-200 ${language === "ar" ? "opacity-100 visible" : "opacity-0 invisible hidden"}`}>
                        <h2 className="mb-10">المنهجية</h2>
                        <p className="intro">
                            كل حادثة في هذا الأرشيف مبنية على مواد متاحة للجميع، وكل خطوة أدناه يمكن لأي شخص
                            آخر إعادة تنفيذها. ما يلي هو كيف تتحوّل لقطة مصوّرة إلى نقطة على الخريطة: أين
                            أجدها، وكيف أتأكّد أنّها تُظهر فوسفوراً أبيض لا شيئاً آخر، وكيف أحدّد مكانها وزمانها.
                        </p>

                        <section>
                            <h3>جمع البيانات</h3>
                            <p>
                                أبني قاعدة البيانات ممّا يُنشر علناً. أتابع منصّات التواصل &mdash; إكس (تويتر)
                                وفيسبوك وإنستغرام وتيليغرام &mdash; إلى جانب وسائل الإعلام اللبنانية
                                والدولية، بحثاً عن لقطات للفوسفور الأبيض فوق جنوب لبنان.
                            </p>
                            <p>
                                كما أبحث في أرشيفات الصور لدى وكالات الأنباء. غالباً ما يغطّي مصوّرو الوكالات
                                الضربة نفسها من موقع آخر، ما يمنحني زاوية مستقلّة على حدث رأيته أوّلاً في
                                فيديو هاتف:{" "}
                                <a href="https://www.gettyimages.com/" target="_blank" rel="noopener noreferrer">Getty&nbsp;Images</a>،{" "}
                                <a href="https://www.afpforum.com/" target="_blank" rel="noopener noreferrer">AFP&nbsp;Forum</a>،{" "}
                                <a href="https://www.anpfoto.nl/" target="_blank" rel="noopener noreferrer">ANP</a>،{" "}
                                <a href="https://www.anadoluimages.com/" target="_blank" rel="noopener noreferrer">Anadolu Images</a>.
                                هذه الصور مرخّصة، لذلك لا أعيد نشرها هنا. بدلاً من ذلك تُحيل كل حادثة
                                إلى المصدر كما نشره صاحبه.
                            </p>
                        </section>

                        <section>
                            <h3>تحديد الذخيرة</h3>
                            <p>
                                ليس كل عمود دخان أبيض فوسفوراً أبيض. الذخيرة التي يُخلط بينها وبينه أكثر من
                                غيرها هي دخان HC &mdash; خليط سداسي كلورو الإيثان والزنك &mdash; الذي تُطلقه
                                الجيوش للغرض الساتر نفسه. والقوات الإسرائيلية تستخدم الاثنين: قذيفة الفوسفور
                                الأبيض من طراز M825 وقذيفة M150 الحاملة لدخان HC، بالعيار نفسه 155 ملم
                                وبطلاء يكاد يكون متطابقاً. الخلط بينهما هو الخطأ الأكثر شيوعاً في تغطية هذه
                                الضربات، ولهذا هو أوّل ما أستبعده.
                            </p>
                            <p>
                                الفارق يظهر بأوضح صوره في الثواني الأولى، ويعود إلى رقم. تحمل قذيفة M825
                                <strong>116</strong> إسفينة لبّاد مشبّعة بالفوسفور، تشتعل عند ملامستها
                                الهواء وتتساقط كنقاط مشتعلة يجرّ كلّ منها خيطاً أبيض &mdash; الشكل
                                الأخطبوطي المعروف لهذه الأعمدة. أمّا M150 فتقذف <strong>خمس</strong> عبوات
                                HC تستقرّ على الأرض وتظلّ تدخّن.
                                بعد دقائق قد تبدو السحابتان متشابهتين، ولهذا أحكم على لحظة الانفجار لا
                                على ما يليها.
                            </p>
                            <p>
                                للفروق الشكلية وعلامات الطلاء بين القذيفتين أعتمد على تريفور بول ون. ر.
                                ينزن-جونز،{" "}
                                <a href="https://armamentresearch.com/differentiating-m825-wp-and-m150-hc-smoke-artillery-projectiles/" target="_blank" rel="noopener noreferrer">
                                    Differential identification of M825 WP and M150 HC smoke artillery projectiles
                                </a>{" "}
                                (Armament Research Services، 2024)، وعلى{" "}
                                <a href="https://osmp.ngo/" target="_blank" rel="noopener noreferrer">Open-source Munitions Portal</a>{" "}
                                الذي يستند إليه المقال، وهو يوثّق صوراً للذخائر نفسها.
                            </p>

                            <div className="munition-grid">
                                <figure>
                                    <img className="crop-top" src="/about/munition_hc_day.png" alt="دخان HC نهاراً" />
                                    <figcaption><span className="munition-tag munition-tag-hc">HC</span> خمس عبوات. قليلة بما يكفي لعدّها.</figcaption>
                                </figure>
                                <figure>
                                    <img src="/about/munition_hc_night.png" alt="دخان HC ليلاً" />
                                    <figcaption><span className="munition-tag munition-tag-hc">HC</span> الخمس نفسها، تتساقط على مسارات ثابتة.</figcaption>
                                </figure>
                                <figure>
                                    <img className="crop-top" src="/about/munition_wp_day.png" alt="فوسفور أبيض نهاراً" />
                                    <figcaption><span className="munition-tag munition-tag-wp">WP</span> 116 إسفينة من قذيفة واحدة.</figcaption>
                                </figure>
                                <figure>
                                    <img src="/about/munition_wp_night.png" alt="فوسفور أبيض ليلاً" />
                                    <figcaption><span className="munition-tag munition-tag-wp">WP</span> الـ116 نفسها، مشتعلةً حيث تسقط.</figcaption>
                                </figure>
                            </div>
                            <p>
                                العدد إذاً هو الفيصل، والرقمان بعيدان تماماً عن بعضهما: إن أمكن عدّ الخيوط
                                على أصابع اليد فهي HC، وإن تعذّر عدّها أصلاً فهي فوسفور أبيض.
                            </p>

                            <h4>قراءة الانفجار</h4>
                            <p>
                                بعد تأكيد أنّ الضربة فوسفور أبيض، تخبرني اللقطات نفسها كم اتّسع أثرها.
                                باستخدام معلَم معروف الحجم في الصورة &mdash; مبنً، أو عرض طريق، أو عمود
                                كهرباء &mdash; أضبط مقياس الصورة وأقيس أمرين: الارتفاع الذي انفجرت عنده
                                القذيفة، وعرض الأرض التي غطّتها الإسفينات المتساقطة.
                            </p>
                            <figure className="burst-figure">
                                <img src="/about/02_dataVerification.jpg" alt="قياس ارتفاع انفجار قذيفتي فوسفور أبيض وعرض ارتطامهما" />
                                <figcaption>
                                    انفجاران فوق البلدة نفسها. القذيفة اليمنى انفتحت على ارتفاع نحو
                                    148&nbsp;متراً وسقطت شبه عمودية، فغطّت نحو 85&nbsp;متراً من الأرض. واليسرى
                                    انفتحت أدنى، عند نحو 82&nbsp;متراً، لكن بزاوية أشدّ ميلاً، فنثرت الإسفينات
                                    على أكثر من 105&nbsp;أمتار.
                                </figcaption>
                            </figure>
                            <p>
                                ارتفاع الانفجار ليس تفصيلاً. القذيفة التي تنفجر عالياً تنثر إسفيناتها على مساحة
                                أوسع، والهبوط المائل يزيد الاتّساع &mdash; ولهذا قد تترك قذيفتان من الطراز
                                نفسه أثرين مختلفين تماماً. من هذه القياسات تأتي تقديرات المساحة المعروضة
                                على الخريطة، ولهذا تُعطى كمجال لا كنصف قطر ثابت.
                            </p>
                        </section>

                        <section>
                            <h3>التحقق من البيانات</h3>
                            <p>
                                قبل كل شيء أتحقّق أنّ اللقطات ليست معادة من حرب سابقة. البحث العكسي عن
                                الصور عبر{" "}
                                <a href="https://images.google.com/" target="_blank" rel="noopener noreferrer">غوغل</a>{" "}
                                يكشف أقدم نشر للمقطع، أو للقطة مأخوذة منه، وهو ما يحسم عادةً ما إذا كان
                                جديداً.
                            </p>
                            <p>
                                ثمّ أقاطعه مع كل ما قيل في ذلك اليوم &mdash; وكالات الأنباء اللبنانية
                                والصفحات الإخبارية المحلية، ومنشورات أهالي القرية أنفسهم. نادراً ما تكون
                                الضربة أثرها الوحيد، وحين تصف تلك الروايات شيئاً لم أره، فإنّها كثيراً ما
                                تدلّ على لقطات أفضل من المقطع الذي بدأت منه. وما يتبيّن أنّه أقدم أو من
                                مكان آخر يُستبعد بدل أن يُسجّل مع تحفّظ.
                            </p>
                        </section>

                        <section>
                            <h3>تحديد الموقع الجغرافي</h3>
                            <p>
                                تحديد الموقع يثبّت إحداثيات الضربة انطلاقاً من اللقطات نفسها. أعمل على ما
                                يظهر في الكادر &mdash; خطوط التلال، الطرق، مئذنة، شكل حافة العمران، ترتيب
                                البيوت البلاستيكية &mdash; وأقارنها بالصور الفضائية وصور الشارع حتّى يتحدّد
                                موقع الكاميرا ونقطة السقوط معاً. عمليّاً يعني ذلك التنقّل بين{" "}
                                <a href="https://www.google.com/earth/about/versions/" target="_blank" rel="noopener noreferrer">Google&nbsp;Earth&nbsp;Pro</a>،
                                الذي يتيح صوراً تاريخية يمكن الرجوع فيها إلى الوراء، والمصادر الأعلى
                                دقّة أدناه.
                            </p>
                            <p>
                                الضربة التي لا أستطيع تحديد موقعها بهذه الطريقة تبقى في الأرشيف كمُتحقّق
                                منها لكن غير محدّدة الموقع بعد: تُحتسب وتظهر في المجاميع، لكن بلا نقطة
                                على الخريطة حتّى يتمكّن أحد من تثبيتها.
                            </p>
                            <img src="/about/03_geolocationChronolocation.jpg" alt="تحديد الموقع والتوقيت" />
                        </section>

                        <section>
                            <h3>تحديد التوقيت</h3>
                            <p>
                                تحديد التوقيت يختبر التاريخ المُعلن. أقارن الصور الفضائية قبل اليوم
                                المذكور وبعده بحثاً عن آثار الحرق التي يخلّفها الفوسفور الأبيض على الأرض
                                المكشوفة. وحين تُظهر اللقطات ظلالاً، فإنّ اتجاهها وطولها يضيّقان وقت
                                النهار، وهو ما أتحقّق منه بـ{" "}
                                <a href="https://www.suncalc.org/" target="_blank" rel="noopener noreferrer">SunCalc</a>.
                            </p>
                            <p>
                                مصدران فضائيّان ينجزان معظم هذا العمل.{" "}
                                <a href="https://browser.dataspace.copernicus.eu/" target="_blank" rel="noopener noreferrer">Copernicus&nbsp;Browser</a>{" "}
                                التابع للاتحاد الأوروبي يوفّر صور Sentinel-2 مجاناً كلّ بضعة أيام، وهو
                                كافٍ لحصر التاريخ رغم أنّ كلّ بكسل يغطّي عشرة أمتار. ولما هو أدقّ
                                أستخدم صور{" "}
                                <a href="https://www.planet.com/" target="_blank" rel="noopener noreferrer">Planet&nbsp;Labs&nbsp;PBC</a>،
                                المتاحة بموجب{" "}
                                <a href="https://www.planet.com/industries/education-and-research/" target="_blank" rel="noopener noreferrer">رخصة التعليم والبحث</a>{" "}
                                الخاصّة بها، والتي تغطّي الاستخدام الأكاديمي غير التجاري، وهي السبب في
                                إمكانية عرض هذه الصور هنا أصلاً.
                            </p>
                            <p>
                                لهذه الطريقة حدود حقيقية، وأفضّل ذكرها على الإيحاء بدقّة لا أملكها. الغيوم
                                تحجب الأرض. وهناك أيّام بلا تمريرة صالحة أصلاً. والفوسفور الأبيض لا يترك
                                أثراً دائماً &mdash; في منطقة مبنية، أو حين يحترق قبل بلوغ الأرض، قد لا
                                يكون هناك ما يُرى من الفضاء رغم وقوع الضربة.
                            </p>
                            <div className="grid grid-cols-2 w-full gallery mt-10">
                                <img className="object-cover  w-full" src="/about/Chronolocation1.jpeg" alt="chronolocation_img" />
                                <img className="object-cover w-full " src="/about/Chronolocation2.jpeg" alt="chronolocation_img" />
                                <img className="object-cover w-full" src="/about/Chronolocation3.jpeg" alt="chronolocation_img" />
                                <video className="object-cover w-full h-full" controls={false} autoPlay loop muted>
                                    <source src="/about/Chronolocation4.mp4" type="video/mp4" />
                                </video>
                            </div>
                        </section>

                        <section>
                            <h3>إدماج البيانات وعرضها</h3>
                            <p>
                                تُسجّل كل حادثة مؤكّدة مرّة واحدة في{" "}
                                <a href="https://qgis.org/" target="_blank" rel="noopener noreferrer">QGIS</a>،
                                مع إحداثياتها وتاريخها وتوقيتها، والبلدة التي سقطت فيها، ونوع
                                الأرض التي أصابتها، ومن حدّد موقعها، وروابط المواد المصدرية. هذه
                                القاعدة الواحدة هي ما يقرأه الموقع، فالخريطة والخطّ الزمني والرسوم
                                البيانية ومؤشّر التلوّث أعلى كلّ صفحة كلّها عروض للسجلّ نفسه ولا يمكن
                                أن تتناقض فيما بينها.
                            </p>
                            <p>
                                ولأنّ العدّ مشتقّ لا مُدخَل يدويّاً، فإنّ تصحيح حادثة واحدة يصحّح كلّ
                                رقم على الموقع دفعةً واحدة.
                            </p>
                        </section>

                        <section>
                            <h3>الأدوات والمصادر</h3>
                            <p>
                                كلّ ما سبق مرتبط في موضعه. وهو مجموع هنا أيضاً ليمكن أخذ الأدوات على حدة.
                            </p>
                            <ul className="tool-list">
                                <li>
                                    <a href="https://armamentresearch.com/differentiating-m825-wp-and-m150-hc-smoke-artillery-projectiles/" target="_blank" rel="noopener noreferrer">Ball &amp; Jenzen-Jones, M825 WP vs M150 HC</a>
                                    <span className="tool-note">كيف نميّز بين قذيفتي الدخان الإسرائيليتين. ARES، 2024.</span>
                                </li>
                                <li>
                                    <a href="https://osmp.ngo/" target="_blank" rel="noopener noreferrer">Open-source Munitions Portal</a>
                                    <span className="tool-note">صور مرجعية للذخائر، من ARES وAirwars.</span>
                                </li>
                                <li>
                                    <a href="https://images.google.com/" target="_blank" rel="noopener noreferrer">البحث العكسي عن الصور في غوغل</a>
                                    <span className="tool-note">يكشف أقدم نشر لمقطع أو للقطة مأخوذة منه.</span>
                                </li>
                                <li>
                                    <a href="https://browser.dataspace.copernicus.eu/" target="_blank" rel="noopener noreferrer">Copernicus Browser</a>
                                    <span className="tool-note">صور Sentinel-2 مجاناً كلّ بضعة أيام. عشرة أمتار لكلّ بكسل.</span>
                                </li>
                                <li>
                                    <a href="https://www.planet.com/industries/education-and-research/" target="_blank" rel="noopener noreferrer">Planet Education and Research</a>
                                    <span className="tool-note">صور يومية عالية الدقة برخصة أكاديمية غير تجارية.</span>
                                </li>
                                <li>
                                    <a href="https://www.suncalc.org/" target="_blank" rel="noopener noreferrer">SunCalc</a>
                                    <span className="tool-note">موقع الشمس وطول الظلّ في مكان ولحظة محدّدين.</span>
                                </li>
                                <li>
                                    <a href="https://www.google.com/earth/about/versions/" target="_blank" rel="noopener noreferrer">Google Earth Pro</a>
                                    <span className="tool-note">صور تاريخية يمكن الرجوع فيها إلى الوراء أثناء تحديد المواقع.</span>
                                </li>
                                <li>
                                    <a href="https://qgis.org/" target="_blank" rel="noopener noreferrer">QGIS</a>
                                    <span className="tool-note">حيث تُسجّل كلّ حادثة وتُحفظ قاعدة البيانات التي يقوم عليها الموقع.</span>
                                </li>
                                <li>
                                    <a href="https://www.gettyimages.com/" target="_blank" rel="noopener noreferrer">Getty Images</a>،{" "}
                                    <a href="https://www.afpforum.com/" target="_blank" rel="noopener noreferrer">AFP Forum</a>،{" "}
                                    <a href="https://www.anpfoto.nl/" target="_blank" rel="noopener noreferrer">ANP</a>،{" "}
                                    <a href="https://www.anadoluimages.com/" target="_blank" rel="noopener noreferrer">Anadolu Images</a>
                                    <span className="tool-note">أرشيفات صور الوكالات، إلى جانب منصّات التواصل.</span>
                                </li>
                            </ul>
                        </section>

                        <hr className="mb-10" />
                        <section className="method-contact mt-32 mb-32">
                            إذا كانت لديكم لقطات إضافية ترغبون في مشاركتها، يُرجى التواصل معي عبر
                            a.b.baydoun@tudelft.nl.
                        </section>
                    </div>
                </div>
            </main >
            <Footer />
        </div >
    );
}
