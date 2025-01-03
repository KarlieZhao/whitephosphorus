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


    const handleContextMenu = (event: React.MouseEvent) => {
        // event.preventDefault();
    };
    return (
        <div>
            <Header TypeWriterFinished={false} />

            {/* media overlay */}
            <div id="media-overlay" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div id="overlay-content" className="border-2 flex justify-center items-center"></div>
            </div>

            <main onContextMenu={handleContextMenu} className={`method-page min-h-screen ${isMobile ? "block mt-20 mx-3" : "flex justify-center"}`}>
                <div className="inner-backdrop"></div>

                <div className={`relative ${isMobile ? "mt-10 mx-0 w-100" : "mt-32 mx-20 w-[60vw]"} text-white block`}>

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

                    <div className={`en absolute transition-opacity duration-200 ${language === "en" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                        <h2 className="mb-10">Methodology</h2>
                        <section>
                            <h3>Data Collection</h3>
                            <p>
                                Our data collection strategy is a blend of digital tools and people on the ground to build a comprehensive dataset on white phosphorus use in South Lebanon. We use web scraping to continuously monitor online platforms, including social media like X (Twitter), Facebook, Instagram, and news outlets. Enhancing this digital approach, we collaborate with Green Southerners, who have connected us with an extensive network of local contacts across different villages. These local sources are key in our data collection, providing real-time, firsthand video footage and updates. They contribute actively by sharing information through village-specific groups and dedicated Telegram channels. Additionally, we work closely with reporters on the ground.
                            </p>
                            <img src="/about/01_dataCollection.jpeg" alt="data collection" />
                        </section>

                        <section>
                            <h3>Data Verification</h3>
                            <p>Our verification process begins by ensuring the footage is not recycled from previous conflicts. We conduct reverse image searches to trace the original posting of each piece of footage on the internet. We consulted with weapons experts to analyze the initial burst of white phosphorus, which is critical for accurate identification. This early stage of the burst is key because the white, tentacular smoke patterns are most distinct right after deployment. Minutes later, the smoke cloud can change shape, potentially resembling other incendiary weapons. By focusing on the initial burst, we ensure that our evidence is accurately attributed to specific plume caused by white phosphorus shells.</p>
                            <img src="/about/02_dataVerification.jpg" alt="data verification" />
                        </section>

                        <section>
                            <h3>Geolocation</h3>
                            <p>Geolocation is critical for verifying the exact
                                coordinates of each incident from the footage.
                                This involves analysing visual cues such
                                as landmarks, landscape features, and urban
                                layouts visible in the videos. We use these
                                cues to cross-reference with existing geographic
                                data and satellite imagery to pinpoint
                                the precise location where each incident
                                occurred. This process confirms that
                                the events took place within specific regions
                                of Lebanon and prevents the recycling of
                                footage from other conflicts.</p>
                            <img src="/about/03_geolocationChronolocation.jpg" alt="geolocation and chronolocation" />
                        </section>

                        <section><h3>Chronolocation</h3><p>
                            This process verifies the claimed dates of incidents by cross-referencing satellite imagery from periods surrounding
                            each reported event. This method involves analyzing imagery taken before and after the alleged dates to identify any
                            signs of white phosphorus use, such as burn marks, confirming whether the incidents occurred as reported. However,
                            several challenges affect this verification process. Cloud cover can obscure the earth's surface, preventing the detection
                            of changes. There are also gaps in satellite coverage, which mean no images are available for certain days, and the
                            non-visible impact of white phosphorus, particularly in urban settings or instances where it doesn't make ground contact,
                            may leave no detectable traces.
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
                            <p>The next step is to integrate this data into our mapping systems. We use ArcGIS to log each incident, ensuring that all data points are accurately plotted on the map. Simultaneously, we update our website with the logged data, which automatically refreshes the charts and the toxicity counter on our digital platform. This ensures that our analysis is current and reflects updated data. Additionally, associated video footage and other relevant data are embedded alongside the mapped incidents to provide a broad view of each event. </p>
                        </section>
                        <hr className="mb-10" />
                        <section className="mt-20">If you have additional footage you would like to share with us, please reach out to us at phosphorusfinder@gmail.com.</section>
                    </div>

                    <div className={`ar absolute transition-opacity duration-200 ${language === "ar" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                        <h2 className="mb-10">المنهجية</h2>
                        <section>
                            <h3>جمع البيانات</h3>
                            <p>
                                استراتجيتنا في جمع البيانات تمزج بين الأدوات الرقمية والعناصر البشرية على الأرض لبناء قاعدة بيانات شاملة حول استخدام الفوسفور الأبيض في جنوب لبنان. نستخدم تقنيات لمراقبة المنصات الإلكترونية بشكل مستمر، بما في ذلك وسائل التواصل الاجتماعي مثل تويتر، فيسبوك، إنستغرام، ووسائل الإعلام الإخبارية. لتعزيز هذه الطريقة الرقمية، نتعاون مع "الجنوبيون الخضر، الذين وفروا لنا اتصالات موسعة مع شبكة من المصادر المحلية في مختلف القرى. هذه المصادر المحلية هي ركيزة أساسية في عملية جمع البيانات، حيث توفر لقطات فيديو وتحديثات مباشرة ومن الميدان. يساهمون بنشاط من خلال مشاركة المعلومات عبر مجموعات مخصصة لكل قرية وقنوات تليغرام محددة. بالإضافة إلى ذلك، نعمل عن كثب مع الصحفيين الموجودين على الأرض.
                            </p>
                            <img src="/about/01_dataCollection.jpeg" alt="data collection" />
                        </section>

                        <section>
                            <h3>التحقق من البيانات</h3>
                            <p>
                                تبدأ عملية التحقق لدينا بالتأكد من أن اللقطات لم يتم إعادة استخدامها من نزاعات سابقة. نقوم بإجراء عمليات بحث عكسية للصور لتتبع النشر الأصلي لكل قطعة من اللقطات على الإنترنت. استشرنا خبراء في الأسلحة لتحليل الانفجار الأولي للفوسفور الأبيض، والذي يعد حاسمًا للتعرف بدقة. المرحلة المبكرة من الانفجار حيوية لأن أنماط الدخان الأبيض، التي تشبه الأذرع، تكون أكثر وضوحًا مباشرة بعد النشر. بعد دقائق، يمكن أن تتغير شكل سحابة الدخان، بحيث قد تشبه الأسلحة الحارقة الأخرى. من خلال التركيز على الانفجار الأولي، نضمن أن يُعزى دليلنا بدقة إلى العمود الخاص الناتج عن قذائف الفوسفور الأبيض.
                            </p>
                            <img src="/about/02_dataVerification.jpg" alt="data verification" />
                        </section>

                        <section>
                            <h3>تحديد المواقع الجغرافية والزمنية</h3>
                            <p>
                                بمجرد التحقق من صحة اللقطات، تصبح الخطوة التالية هي تحديد مواقع وتواريخ الحوادث بدقة. يشمل تحديد الموقع الجغرافي تحليل الإشارات البصرية داخل اللقطات مثل المعالم، وميزات المناظر الطبيعية، وتخطيطات المدن لتحديد موقع الحدث بدقة. هذه العملية مهمة لرسم خرائط للمناطق الأكثر تأثراً بالفوسفور الأبيض وللتحقق من صحة الادعاءات مقابل البيانات الجغرافية. بالنسبة لتحديد التوقيت، نقيم الصور الفضائية الملتقطة قبل وبعد الحادثة بالتزامن مع بيانات اللقطات لتحديد التاريخ والوقت الدقيقين اللذين وقعت فيهما. هذا يساعد على ضمان دقة بياناتنا الزمنية، مما يمنع استخدام معلومات قديمة أو مضللة.                            </p>
                            <img src="/about/03_geolocationChronolocation.jpg" alt="geolocation and chronolocation" />

                            <div className="grid grid-cols-2 w-full gallery mt-10">
                                <img className="object-cover  w-full" src="/about/Chronolocation1.jpeg" alt="chronolocation_img" />
                                <img className="object-cover w-full " src="/about/Chronolocation2.jpeg" alt="chronolocation_img" />
                                <img className="object-cover w-full" src="/about/Chronolocation3.jpeg" alt="chronolocation_img" />
                                <video className="object-cover w-full h-full" controls={false} autoPlay loop muted>
                                    <source src="/about/Chronolocation4.mp4" type="video/mp4" />
                                </video>
                            </div> </section>

                        <section>
                            <h3>رفع البيانات على الموقع الإلكتروني</h3>
                            <p>
                                تتمثل الخطوة التالية في تسجيل البيانات على أنظمتنا الخرائطية. نقوم برفع كل حادثة إلى الموقع الإلكتروني، مما يضمن وضع جميع النقاط بدقة على الخريطة. يتم تحديث الرسوم البيانية وعداد التلوث على منصتنا الرقمية تلقائيًا، مما يضمن أن تحليلاتنا تعكس أحدث البيانات. بالإضافة إلى ذلك، يتم تضمين لقطات الفيديو المرتبطة والبيانات ذات الصلة بجانب الحوادث المرسومة على الخريطة لتقديم صورة شاملة لكل حدث.
                            </p>
                        </section>
                        <hr className="mb-10" />
                        <section className="mt-20">
                            إذا كانت لديكم لقطات إضافية ترغبون في مشاركتها معنا، يُرجى التواصل معنا عبر البريد الإلكتروني: phosphorusfinder@gmail.com.                            </section>
                    </div>
                </div>
            </main >
            <Footer />
        </div >
    );
}
