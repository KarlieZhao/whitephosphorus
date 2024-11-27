interface CloudRow {
    name: string;
    name_ar: string;
    video: string;
    text: string;
    text_ar: string;
    images: Array<string>;
    videos: Array<string>
}

interface DataInputRow {
    name: string;
    name_ar: string;
    text: string;
    text_ar: string;
    img_count: number;
    video_count: number
}

const inputData: DataInputRow[] = [
    {
        name: "White Phosphorus",
        name_ar: "فوسفور أبيض",
        text: "Upon detonation, WP munitions like the M825A1 155mm artillery shell eject approximately 116 WP-impregnated felt wedges into the air. These wedges ignite upon exposure to oxygen, producing a dense, white smoke plume that rapidly expands. The resulting cloud is thick and white, often resembling a jellyfish as it disperses. The ignited felt wedges create trailing streams of smoke, giving the plume a tentacle-like appearance as they descend. The smoke emits a distinct garlic-like odor.",
        text_ar: "عند انفجارها، تطلق قذائف الفوسفور الأبيض قذيفة قطرها 155 ملم، حوالي 116 شظية مشبعة بالفوسفور الأبيض في الهواء. هذه الشظايا تشتعل عند تعرضها للأكسجين، مما ينتج عنه سحابة دخان كثيفة وبيضاء تتسع بسرعة. السحابة الناتجة تكون سميكة وبيضاء، وغالبًا ما تشبه قنديل البحر وهي تتفرق. الشظايا المشتعلة تخلق خطوط دخانية تعطي السحابة مظهرًا شبيهًا بالأذرع وهي تهبط. الدخان يصدر رائحة تشبه رائحة الثوم.",
        img_count: 6,
        video_count: 3
    },
    {
        name: "Flare",
        name_ar: "القنبلة الضوئية",
        text: "A military flare is a pyrotechnic device designed to produce a bright light or intense heat without an explosion. Flares serve multiple purposes, including signaling and illumination. Upon activation, they emit a brilliant light, often accompanied by a trail of smoke, making them visible over long distances. Some flares are equipped with small parachutes to slow their descent, allowing for prolonged illumination or signaling. ",
        text_ar: "القنبلة الضوئية هي جهاز مصمم لإنتاج ضوء ساطع أو حرارة شديدة دون حدوث انفجار. تستخدم هذه القنابل لأغراض عدة منها الإشارة والإضاءة. عند تفعيلها، تصدر ضوءًا براقًا يصحبه مسار من الدخان، ما يجعلها مرئية من مسافات بعيدة. بعض هذه القنابل مزودة بمظلات صغيرة لتبطئ من سرعة هبوطها، مما يتيح إضاءة أو إشارة لفترة أطول.",
        img_count: 3,
        video_count: 2
    },
    {
        name: "Smoke Bomb M150",
        name_ar: "قنبلة دخان M150",
        text: "The M150 is an Israeli 155mm artillery smoke projectile designed to produce screening smoke using a hexachloroethane (HC)-based composition. Upon detonation, it ejects five HC smoke canisters that ignite upon exposure to air, generating dense, white smoke. The resulting smoke cloud is thick and white. Unlike white phosphorus munitions, the M150's smoke is less toxic and does not have incendiary properties. ",
        text_ar: "هذه القذيفة الإسرائيلية للمدفعية قطرها 155 ملم، مصممة لإنتاج دخان التمويه. عند الانفجار، تطلق خمس علب دخان تشتعل عند تعرضها للهواء، مما يولد دخانًا كثيفًا وأبيض. السحابة الدخانية الناتجة تكون سميكة وبيضاء. على عكس قذائف الفوسفور الأبيض، هذا الدخان لا يمتلك خصائص حارقة.",
        img_count: 0,
        video_count: 1
    },
    {
        name: "Rocket Launches",
        name_ar: "الصواريخ",
        text: "Upon launch, Hezbollah's rockets, such as the Katyusha, Fajr-3, Fajr-5, and Zelzal, emit a bright flash due to propellant ignition. This is followed by a dense, white or gray smoke plume marking the rocket's ascent. As the rocket gains altitude and the propellant burns more efficiently, the visible flame diminishes, resulting in reduced light emission and a less pronounced smoke trail. ",
        text_ar: "عند إطلاقها، تنبعث من صواريخ مثل الكاتيوشا وفجر-3 وفجر-5 وزلزال بريقًا ساطعًا نتيجة اشتعال الوقود. يتبع ذلك عمود دخان كثيف أبيض أو رمادي يعلو مع الصاروخ. مع ارتفاع الصاروخ، يقل ظهور اللهب، مما يؤدي إلى تقليل الضوء المنبعث ويصبح مسار الدخان أقل وضوحًا.",
        img_count: 1,
        video_count: 2
    },
    {
        name: "Iron Dome Missiles",
        name_ar: "صواريخ القبة الحديدية",
        text: "Iron Dome missiles produce distinctive smoke trails characterized by rapid, arcing paths that curve upward to engage incoming rockets. These trails are typically white and dense. The arcing trajectory is a visual indicator of the interceptor adjusting its path to intercept rockets. At night, the launch is marked by a bright flash, and the smoke trails may be illuminated by the missile's exhaust, creating a visible arc against the dark sky. ",
        text_ar: "تنتج صواريخ القبة الحديدية مسارات دخان تتميز بمسارات قوسية سريعة تنحني لمواجهة الصواريخ القادمة. عادة ما تكون هذه المسارات بيضاء وكثيفة. المسار القوسي هو مؤشر لتعديل المسار الصاروخي لاعتراض الصواريخ القادمة. في الليل، يتميز الإطلاق بريقً ساطعًا.",
        img_count: 1,
        video_count: 5
    },
    {
        name: "Detonation of Iron Dome Missile",
        name_ar: "انفجار صاروخ القبة الحديدية",
        text: "When an Iron Dome interceptor missile detonates to neutralize an incoming rocket, it generates a bright flash accompanied by a rapidly expanding smoke cloud, typically white or gray, resulting from the combustion of the missile's components and the intercepted projectile. This smoke plume often forms a spherical or irregular shape, depending on atmospheric conditions and the altitude of the interception. ",
        text_ar: "عندما ينفجر صاروخ إعتراض من القبة الحديدية لتحييد صاروخ قادم، يُولّد بريقًا ساطعًا يُصاحبه سحابة دخان سريعة التوسع، تكون عادة بيضاء أو رمادية، ناتجة عن احتراق مكونات الصاروخ والصاروخ المعترض. غالبًا ما تتشكل هذه السحابة الدخانية بشكل كروي أو غير منتظم.",
        img_count: 3,
        video_count: 1
    },
    {
        name: "Fighter Jets",
        name_ar: "طائرات المقاتلة (حربي)",
        text: "An airstrike from an F-16 or F-35, generates a rapid, intense explosion characterized by a bright flash and a swiftly expanding smoke plume. The plume's appearance varies based on the target and munitions used but typically features a dense, dark gray or black cloud that rises quickly, often forming a mushroom-like shape. The plume's opacity and color are influenced by factors such as the presence of fuel, building materials, and other combustibles at the target site. In some cases, secondary explosions may occur, leading to additional plumes.",
        text_ar: "يُولّد القصف الجوي من طائرة إف-16 أو إف-35 انفجارًا سريعًا وشديدًا يتميز ببريقًا ساطع وسحابة دخان سريعة التوسع. تختلف مظاهر السحابة بناءً على الهدف والذخائر المستخدمة، لكنها عادة ما تكون سحابة كثيفة وداكنة رمادية أو سوداء ترتفع بسرعة، غالبًا ما تكون بشكل مشابه للفطر. تتأثر كثافة ولون السحابة بعوامل مثل وجود الوقود، مواد البناء، ومواد قابلة للاحتراق في موقع الهدف.",
        img_count: 5,
        video_count: 5
    },
    {
        name: "UAV Strike",
        name_ar: "ضربة طائرة بدون طيار (إم كمال)",
        text: "The plume's appearance varies based on the target and munitions used but typically features a dense, dark gray or black cloud that rises quickly, often forming a mushroom-like shape. The plume is generally smaller and more focused than those produced by fighter jet airstrikes, though its size and intensity can vary depending on what is exploding. The plume's opacity and color are influenced by factors such as the presence of fuel, building materials, and other combustibles at the target site.",
        text_ar: "تختلف مظاهر السحابة بناءً على الهدف والذخائر المستخدمة، لكنها عادة ما تتميز بسحابة كثيفة وداكنة رمادية أو سوداء ترتفع بسرعة، غالبًا ما تكون بشكل مشابه للفطر. عادةً ما تكون هذه السحابة أصغر حجمًا وأكثر تحديدًا من تلك التي تنتجها ضربات طائرات المقاتلة، رغم أن حجمها وشدتها يمكن أن يختلفان بناءً على ما ينفجر.",
        img_count: 2,
        video_count: 3
    },
    {
        name: "Artillery Shelling",
        name_ar: "قصف مدفعي",
        text: "Artillery shell impacts produce plumes that are typically short-lived and concentrated, featuring bursts of dark gray or black smoke that rise rapidly before dispersing. The plume's shape is usually conical or irregular, influenced by the ground impact and the surrounding materials being ejected. These plumes are smaller and more contained compared to those from airstrikes, though repeated shelling can create overlapping clouds.",
        text_ar: "تنتج ضربات قذائف المدفعية سحبًا عادة ما تكون قصيرة الأمد ومركزة، تظهر على شكل انفجارات من الدخان الرمادي الداكن أو الأسود التي ترتفع بسرعة قبل أن تتفرق. عادةً ما تكون شكل السحابة غير منتظم، متأثرًا بتأثير الارتطام بالأرض والمواد المحيطة. هذه السحب أصغر وأكثر تحديدًا مقارنة بتلك الناتجة عن الغارات الجوية، رغم أن القصف المتكرر يمكن أن يخلق سحبًا متداخلة.",
        img_count: 2,
        video_count: 5
    },
    {
        name: "Contrails",
        name_ar: "خطوط البخار",
        text: "Fighter jet contrails are long, thin, white trails formed when the jet's exhaust gases mix with cold, moist air at high altitudes. The water vapor in the exhaust condenses into ice crystals, creating visible streaks in the sky. Contrails often appear straight or slightly curved, following the jet's flight path. Their persistence and spread depend on atmospheric conditions such as humidity and temperature. In humid conditions, contrails may linger and expand, while in drier air, they dissipate quickly, leaving only faint traces.",
        text_ar: "تترك الطائرات الاسرائيلية المقاتلة خلفها خطوطًا بيضاء رفيعة ومستقيمة في السماء، والتي تُعرف بخطوط البخار. هذه الخطوط تتشكل عندما تختلط غازات الساخنة من الطائرة مع الهواء البارد والرطب على ارتفاعات عالية، حيث يتحول بخار الماء إلى بلورات ثلج، مما يخلق هذه الخطوط الظاهرة.",
        img_count: 2,
        video_count: 4
    }
];


const generateLinks = (inputArray: DataInputRow[]): CloudRow[] => {
    return inputArray.map((item, index) => ({
        ...item,
        video: `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/${item.name
            .replace(/ /g, "")}.mp4`, // Generate video path
        images: Array.from({ length: item.img_count }, (_, i) =>
            `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/cloud_footage/${index + 1}_${item.name}/i${i + 1}.jpg`
        ),// Generate footage paths
        videos: Array.from({ length: item.video_count }, (_, i) =>
            `${process.env.NEXT_PUBLIC_CDN_URL}/cloud_videos/cloud_footage/${index + 1}_${item.name}/v${i + 1}.mp4`)
    }));
};

const cloudData = generateLinks(inputData);
export default cloudData;