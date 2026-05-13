# Mapping of questions to pillars
FINLO_PILLARS = {
    'F': 'FORESIGHT',
    'I': 'INSIGHT',
    'N': 'NEXUS',
    'L': 'LOGIC',
    'O': 'ODYSSEY'
}

QUESTION_PILLAR_MAPPING = {
    # F - FORESIGHT (1-5)
    1: 'F', 2: 'F', 3: 'F', 4: 'F', 5: 'F',
    # I - INSIGHT (6-10)
    6: 'I', 7: 'I', 8: 'I', 9: 'I', 10: 'I',
    # N - NEXUS (11-15)
    11: 'N', 12: 'N', 13: 'N', 14: 'N', 15: 'N',
    # L - LOGIC (16-20)
    16: 'L', 17: 'L', 18: 'L', 19: 'L', 20: 'L',
    # O - ODYSSEY (21-25)
    21: 'O', 22: 'O', 23: 'O', 24: 'O', 25: 'O'
}

# The 25 FINLO Questions Data
FINLO_QUESTIONS = [
    {
        "id": 1,
        "pillar": "F",
        "title_np": "समस्या",
        "title_en": "Problem",
        "question_np": "तपाईंको व्यवसायले कस्तो समस्या समाधान गर्छ?",
        "question_en": "What problem does your business solve?",
        "hint": "Nepal example: 'Farmers near Dhading lose 30% of vegetables before reaching Kathmandu because there is no cold storage nearby.'",
        "options": [
            "मानिसहरूले आवश्यक सेवा पाउन सक्दैनन् / People cannot access a product or service they need",
            "कुनै काम धेरै समय वा जटिल छ / Something takes too long or is too complicated",
            "कुनै काम धेरै महँगो छ / Something costs too much money",
            "मानिसहरूसँग सही जानकारी छैन / People lack the right information",
            "दुई पक्षलाई जोड्ने तरिका छैन / No good way to connect two groups of people",
            "पुरानो प्रक्रिया अझ राम्रो हुन सक्छ / An existing process can be done much better"
        ],
        "allow_other": True
    },
    {
        "id": 2,
        "pillar": "F",
        "title_np": "पीडित",
        "title_en": "Affected",
        "question_np": "यो समस्याबाट कसलाई सबैभन्दा बढी असर गर्छ?",
        "question_en": "Who is most affected by this problem?",
        "hint": "Nepal example: 'Small hotel owners in Pokhara who cannot manage online bookings.'",
        "options": [
            "किसान / कृषि उत्पादक / Farmers / Agricultural producers",
            "साना पसलदार / व्यापारी / Small shopkeepers / traders",
            "दैनिक ज्यालादारी कामदार / Daily wage workers",
            "महिला उद्यमी / Women entrepreneurs",
            "युवाहरू (१८-३५) / Young people (18-35)",
            "गाउँ / दुर्गम क्षेत्रका मानिस / People in rural / remote areas",
            "मध्यम वर्गीय सहरी परिवार / Middle-class urban families",
            "अरू व्यवसायहरू (B2B) / Other businesses (B2B)"
        ],
        "allow_other": True
    },
    {
        "id": 3,
        "pillar": "F",
        "title_np": "वर्तमान समाधान",
        "title_en": "Current Solution",
        "question_np": "अहिले मानिसहरूले यो समस्या कसरी सामना गर्छन्?",
        "question_en": "How do people currently deal with this problem?",
        "hint": "Nepal example: 'Currently farmers sell to middlemen at low prices because they cannot reach the market themselves.'",
        "options": [
            "बिचौलियालाई पैसा दिन्छन् / They pay a middleman or agent",
            "आफैं गर्छन् — धेरै समय खर्च हुन्छ / They do it themselves, wasting time",
            "समस्यालाई स्वीकार गरेर बस्छन् / They accept the problem and live with it",
            "कुनै समाधान उपलब्ध छैन / No solution is available at all",
            "पुरानो तरिका प्रयोग गर्छन् / They use an old ineffective method"
        ],
        "allow_other": True
    },
    {
        "id": 4,
        "pillar": "F",
        "title_np": "तपाईंको समाधान",
        "title_en": "Your Solution",
        "question_np": "तपाईंको व्यवसायले यो समस्यालाई कसरी समाधान गर्छ?",
        "question_en": "How does your business solve this problem?",
        "hint": "Nepal example: 'We build a mobile app connecting farmers directly with consumers — no middlemen.'",
        "options": [
            "मोबाइल एप / डिजिटल प्लेटफर्म / Mobile app or digital platform",
            "भौतिक उत्पादन / हार्डवेयर / Physical product / hardware",
            "सेवा व्यवसाय / Service business",
            "बजार / मार्केटप्लेस / Marketplace (connects two groups)",
            "सरकार / संस्थालाई सेवा (B2G/B2B) / Service to government or institutions",
            "वित्तीय सेवा / Financial service",
            "शैक्षिक सेवा / Education service or training"
        ],
        "allow_other": True
    },
    {
        "id": 5,
        "pillar": "F",
        "title_np": "फरक",
        "title_en": "Difference",
        "question_np": "तपाईंको समाधान अरूभन्दा कसरी फरक छ?",
        "question_en": "How is your solution different from what already exists?",
        "hint": "Nepal example: 'Other apps only work for large urban farmers. Ours works offline too.'",
        "options": [
            "हामी सस्तो छौं — सोही काम कम पैसामा / We are cheaper for the same job",
            "हामी छिटो छौं / We are faster",
            "नेपालमा पहिलो पटक / First time in Nepal",
            "प्रविधिले हातले गरिने काम स्वचालित / Technology automates manual processes",
            "गुणस्तर निकै राम्रो / Quality is significantly better",
            "अहिलेसम्म सेवा नपाएको समूहलाई / Serving a group no one has served before"
        ],
        "allow_other": True
    },
    {
        "id": 6,
        "pillar": "I",
        "title_np": "ग्राहक",
        "title_en": "Customers",
        "question_np": "तपाईंको उत्पादन वा सेवा कसले किन्छ?",
        "question_en": "Who buys your product or service?",
        "hint": "Nepal example: 'Working women aged 25-45 in Kathmandu who do not have time to cook at home.'",
        "options": [
            "सामान्य व्यक्ति / परिवार (B2C) / Individual consumers / families (B2C)",
            "साना व्यवसाय (B2B) / Small businesses (B2B)",
            "ठूला कम्पनी (B2B Enterprise) / Large companies (B2B Enterprise)",
            "सरकार / सार्वजनिक संस्था (B2G) / Government or public institutions (B2G)",
            "किसान / कृषि उत्पादक / Farmers / agricultural producers",
            "स्वास्थ्यकर्मी / शिक्षक / Healthcare workers / teachers"
        ],
        "allow_other": True
    },
    {
        "id": 7,
        "pillar": "I",
        "title_np": "बजार आकार",
        "title_en": "Market Size",
        "question_np": "नेपालमा कति सम्भावित ग्राहक छन्?",
        "question_en": "How many potential customers are in Nepal?",
        "hint": "Nepal example: 'There are over 50,000 small restaurants in Kathmandu Valley alone.'",
        "options": [
            "केही सय (५०० भन्दा कम) / A few hundred (less than 500)",
            "हजारौं (५०० – १०,०००) / Thousands (500 – 10,000)",
            "दस हजारदेखि लाखसम्म / Tens of thousands to hundreds of thousands",
            "लाखौं (१,००,०००+) / Millions (more than 100,000)",
            "मलाई थाहा छैन / I am not sure — can estimate"
        ],
        "allow_other": True
    },
    {
        "id": 8,
        "pillar": "I",
        "title_np": "मूल्य",
        "title_en": "Pricing",
        "question_np": "तपाईंले आफ्नो उत्पादन/सेवाको मूल्य कति राख्ने सोच्नुभएको छ?",
        "question_en": "How much do you plan to charge?",
        "hint": "Nepal example: 'NPR 500 per month subscription.' or 'NPR 200 profit per product.'",
        "options": [
            "नि:शुल्क (पछि अरू तरिकाले आम्दानी) / Free (monetise through other means later)",
            "एकपटकको भुक्तानी / One-time payment",
            "मासिक / वार्षिक सदस्यता / Monthly or yearly subscription",
            "प्रत्येक लेनदेनमा कमिसन / Commission per transaction",
            "मात्रा अनुसार मूल्य / Volume pricing",
            "सरकार / संस्थाले तिर्छ / Government or institution pays"
        ],
        "allow_other": True
    },
    {
        "id": 9,
        "pillar": "I",
        "title_np": "लगानी आवश्यकता",
        "title_en": "Investment Need",
        "question_np": "व्यवसाय सुरु गर्न कति पैसा चाहिन्छ र किन?",
        "question_en": "How much investment do you need and why?",
        "hint": "Nepal example: 'NPR 5 million: 2.5M technology, 1.5M team, 1M marketing.'",
        "options": [
            "रु. १० लाखभन्दा कम / Less than NPR 1 Million",
            "रु. १०–५० लाख / NPR 1–5 Million",
            "रु. ५० लाख–१ करोड / NPR 5–10 Million",
            "रु. १–५ करोड / NPR 10–50 Million",
            "रु. ५ करोडभन्दा बढी / More than NPR 50 Million",
            "मलाई थाहा छैन / I am not sure — need guidance"
        ],
        "allow_other": True
    },
    {
        "id": 10,
        "pillar": "I",
        "title_np": "पहिलो वर्ष लक्ष्य",
        "title_en": "Year 1 Target",
        "question_np": "पहिलो वर्षमा कति आम्दानी लक्ष्य छ?",
        "question_en": "What is your Year 1 revenue target?",
        "hint": "Nepal example: 'Target NPR 2.5M in Year 1 from 100 customers.'",
        "options": [
            "अहिले सोचेको छैन / Not set yet — still learning the market",
            "रु. १० लाखभन्दा कम / Less than NPR 1 Million",
            "रु. १०–५० लाख / NPR 1–5 Million",
            "रु. ५० लाख–१ करोड / NPR 5–10 Million",
            "रु. १ करोडभन्दा बढी / More than NPR 10 Million"
        ],
        "allow_other": True
    },
    {
        "id": 11,
        "pillar": "N",
        "title_np": "टोली",
        "title_en": "Team",
        "question_np": "मुख्य व्यक्तिहरू को को हुनुहुन्छ?",
        "question_en": "Who are the main people running this business?",
        "hint": "Nepal example: 'I am Ramu Shrestha, 10 years in agriculture. My partner Sita Pandey is a technology specialist.'",
        "options": [
            "म एक्लै छु (सोलो संस्थापक) / Just me alone (solo founder)",
            "मसँग १ जना साझेदार / I have 1 co-founder",
            "मसँग २–३ जना साझेदार / I have 2–3 co-founders",
            "मसँग ४ वा बढी / I have 4 or more co-founders",
            "म र केही कर्मचारी / Me plus employees (no co-founders)"
        ],
        "allow_other": True
    },
    {
        "id": 12,
        "pillar": "N",
        "title_np": "अनुभव",
        "title_en": "Experience",
        "question_np": "यो व्यवसाय गर्नका लागि तपाईंसँग के अनुभव छ?",
        "question_en": "What relevant experience do you have?",
        "hint": "Nepal example: 'I have 5 years of fish farming experience and personally faced the market problem I am solving.'",
        "options": [
            "यही क्षेत्रमा काम गरिसकेको छु / I have worked directly in this industry",
            "यही समस्या आफैं भोगेको छु / I personally experienced this problem",
            "यही क्षेत्रमा पढेको / तालिम / I have studied or been trained in this field",
            "परिवार / साथीको यही व्यवसाय / My family or friends are in this business",
            "अर्को व्यवसाय गरिसकेको / I have run another business before",
            "नयाँ छु तर टोली राम्रो / New to this but ready to learn with strong team"
        ],
        "allow_other": True
    },
    {
        "id": 13,
        "pillar": "N",
        "title_np": "सीपको कमी",
        "title_en": "Skill Gaps",
        "question_np": "टोलीमा कुन सीपको कमी छ?",
        "question_en": "What skills does your team currently lack?",
        "hint": "Nepal example: 'Our team lacks technical expertise — we need a good software developer.'",
        "options": [
            "प्रविधि / सफ्टवेयर विकास / Technology / software development",
            "बजार र बिक्री / Marketing and sales",
            "वित्त / लेखा / कानुनी / Finance / accounting / legal",
            "उत्पादन / सञ्चालन / Production / operations",
            "सरकारी सम्पर्क / नेटवर्किङ / Government relations / networking",
            "हाम्रो टोली पूर्ण छ / Our team is complete"
        ],
        "allow_other": True
    },
    {
        "id": 14,
        "pillar": "N",
        "title_np": "प्रेरणा",
        "title_en": "Motivation",
        "question_np": "तपाईं यो व्यवसाय गर्न किन प्रेरित हुनुभयो?",
        "question_en": "Why are you motivated to build this business?",
        "hint": "Nepal example: 'When my brother was sick and there was no doctor in our village, I decided to build a remote health service.'",
        "options": [
            "परिवारले यो समस्या भोगेको / My family personally experienced this problem",
            "अवसर देखें — व्यवसाय गर्न चाहन्थें / I saw the opportunity and wanted to build a business",
            "समुदाय / क्षेत्र विकास गर्न / I want to develop my community or region",
            "पेशोको अनुभवले देखायो / My professional experience revealed this problem",
            "विदेशमा यस्तो सफल भएको देखें / I saw this work successfully elsewhere"
        ],
        "allow_other": True
    },
    {
        "id": 15,
        "pillar": "N",
        "title_np": "कानुनी अवस्था",
        "title_en": "Legal Status",
        "question_np": "व्यवसायको कानुनी अवस्था के हो?",
        "question_en": "What is the legal registration status of your business?",
        "hint": "Nepal example: 'Registered as Private Limited with OCR.' or 'Not yet registered.'",
        "options": [
            "प्राइभेट लिमिटेड (OCR दर्ता) / Private Limited Company (registered with OCR)",
            "साझेदारी फर्म / Partnership Firm",
            "एकल स्वामित्व / Sole Proprietorship",
            "सहकारी / Cooperative",
            "सामाजिक उद्यम / NGO / Social Enterprise / NGO",
            "अझ दर्ता भएको छैन / Not yet registered"
        ],
        "allow_other": True
    },
    {
        "id": 16,
        "pillar": "L",
        "title_np": "ग्राहक परीक्षण",
        "title_en": "Customer Testing",
        "question_np": "के तपाईंले ग्राहकहरूसँग परीक्षण गरिसक्नुभएको छ?",
        "question_en": "Have you tested your idea with real customers?",
        "hint": "Nepal example: 'We talked to 20 farmers — 15 showed strong interest.'",
        "options": [
            "व्यक्तिगत कुराकानी गरेको / Had personal conversations with potential customers",
            "सर्वेक्षण / प्रश्नावली गरेको / Done a survey or questionnaire",
            "सानो परीक्षण / पाइलट चलाएको / Run a small test or pilot",
            "पहिल्यैदेखि तिर्ने ग्राहक छन् / Already have paying customers",
            "अझ परीक्षण गरेको छैन / Not yet tested",
            "परीक्षण गर्ने योजना छ / Planning to test soon"
        ],
        "allow_other": True
    },
    {
        "id": 17,
        "pillar": "L",
        "title_np": "हालको आम्दानी",
        "title_en": "Current Revenue",
        "question_np": "के अहिले पैसा कमाइरहेको छ?",
        "question_en": "Is your business currently making money?",
        "hint": "Nepal example: 'Yes — NPR 300,000 in sales last month.' or 'Not yet but 3 customers have signed agreements.'",
        "options": [
            "हो — नियमित तिर्ने ग्राहक छन् / Yes — regular paying customers",
            "हो — एकपटक परीक्षण बिक्री भएको / Yes — some one-off test sales",
            "छैन — तर सम्झौता / प्रतिबद्धता छ / Not yet — but signed commitments from customers",
            "छैन — उत्पादन विकासमा / Not yet — in product development",
            "छैन — विचार तहमा / Not yet — still at idea stage"
        ],
        "allow_other": True
    },
    {
        "id": 18,
        "pillar": "L",
        "title_np": "प्रमाण",
        "title_en": "Evidence",
        "question_np": "यो काम गर्छ भन्ने कुनै प्रमाण छ?",
        "question_en": "Do you have evidence that your business works?",
        "hint": "Nepal example: 'In our pilot, customers bought our product 2x more than the competitor.'",
        "options": [
            "ग्राहकले सकारात्मक प्रतिक्रिया (पैसा तिरेका छैनन्) / Customers gave positive feedback (not paid yet)",
            "ग्राहकले पैसा तिरेका छन् — सबैभन्दा राम्रो प्रमाण / Customers have paid — the strongest proof",
            "प्रतिस्पर्धीभन्दा राम्रो भनी तुलना / Comparison showing we are better than competitors",
            "विशेषज्ञहरूले समर्थन गरेका / Experts or advisors have endorsed the idea",
            "अहिले कुनै ठोस प्रमाण छैन / No concrete proof yet"
        ],
        "allow_other": True
    },
    {
        "id": 19,
        "pillar": "L",
        "title_np": "तुलना",
        "title_en": "Comparison",
        "question_np": "नेपाल वा विश्वमा यस्तो सफल व्यवसाय छ?",
        "question_en": "Is there a successful similar business elsewhere?",
        "hint": "Nepal example: 'BigBasket succeeded in India — we want to bring that model to Nepal.'",
        "options": [
            "हो — नेपालमा नै यस्तो सफल उदाहरण / Yes — successful example right in Nepal",
            "हो — भारत / दक्षिण एशियामा / Yes — similar businesses succeeded in India / South Asia",
            "हो — विश्वमा अरू ठाउँमा / Yes — succeeded elsewhere in the world",
            "छैन — पूर्णतः नयाँ विचार / No — completely new idea",
            "मलाई थाहा छैन / I do not know — not researched yet"
        ],
        "allow_other": True
    },
    {
        "id": 20,
        "pillar": "L",
        "title_np": "जोखिम",
        "title_en": "Risk",
        "question_np": "सबैभन्दा ठूलो जोखिम के हो? (इमानदारीपूर्वक)",
        "question_en": "What is your biggest risk? (Be honest)",
        "hint": "Nepal example: 'Our app does not work without internet. 70% of our customers are in areas with no internet.'",
        "options": [
            "ग्राहकले प्रयोग नगर्न सक्छन् / Customers may not use our product",
            "प्रतिस्पर्धीले राम्रो / सस्तो गर्न सक्छन् / Competitors may do this better or cheaper",
            "सरकारी नियमले असर गर्न सक्छ / Government regulations could affect us",
            "टोलीमा समस्या आउन सक्छ / Team issues might arise",
            "पैसा सकिन सक्छ / We might run out of money",
            "नेपालको पूर्वाधार बाधा बन्न सक्छ / Nepal infrastructure could be a barrier"
        ],
        "allow_other": True
    },
    {
        "id": 21,
        "pillar": "O",
        "title_np": "साझेदार",
        "title_en": "Partners",
        "question_np": "कुन साझेदार वा आपूर्तिकर्ता चाहिन्छन्?",
        "question_en": "What partners or suppliers does your business need?",
        "hint": "Nepal example: 'We need a logistics partner (Bhojraj Logistics), farmer groups, and a tech partner.'",
        "options": [
            "लजिस्टिक्स / ढुवानी / Logistics / transport partner",
            "उत्पादन / आपूर्ति / Manufacturing / supply partner",
            "बैंक / वित्तीय संस्था / Bank / financial institution",
            "सरकारी निकाय / Government body",
            "प्रविधि / IT कम्पनी / Technology / IT company",
            "वितरक / रिटेलर / Distributor / retailer",
            "समुदाय नेता / Community leader / local contact"
        ],
        "allow_other": True
    },
    {
        "id": 22,
        "pillar": "O",
        "title_np": "प्रतिस्पर्धी",
        "title_en": "Competitors",
        "question_np": "तपाईंका प्रतिस्पर्धी को को हन्?",
        "question_en": "Who are your competitors?",
        "hint": "Nepal example: 'Competitors: (1) traditional middlemen, (2) Hamrobazar.com, (3) Facebook Group sales.'",
        "options": [
            "कुनै सिधा प्रतिस्पर्धी छैन / No direct competitor — we are first",
            "१-२ जना सिधा प्रतिस्पर्धी / 1-2 direct competitors",
            "३-५ जना सिधा प्रतिस्पर्धी / 3-5 direct competitors",
            "धैरै प्रतिस्पर्धी — भीडभाड बजार / Many competitors — crowded market",
            "अप्रत्यक्ष प्रतिस्पर्धी मात्र (पुरानो तरिका) / Only indirect competitors (old ways)"
        ],
        "allow_other": True
    },
    {
        "id": 23,
        "pillar": "O",
        "title_np": "विशेष पहुँच",
        "title_en": "Special Access",
        "question_np": "तपाईंसँग कुनै विशेष सम्पर्क वा पहुँच छ जुन अरूसँग छैन?",
        "question_en": "Do you have any special connections competitors lack?",
        "hint": "Nepal example: 'My uncle is an officer at Agricultural Development Bank — access to farmer networks.'",
        "options": [
            "सरकारी / नियामक निकायसँग सम्बन्ध / Connections with government or regulators",
            "उद्योग / व्यापार संघसँग / Industry or trade association connections",
            "ग्राहक समुदायमा विश्वास / Trust within the target customer community",
            "अनन्य प्रविधि / पेटेन्ट / Exclusive technology or patent",
            "विशेष आपूर्तिकर्तासँग सम्झौता / Exclusive supplier agreement",
            "अहिले कुनै विशेष फाइदा छैन / No special advantage yet — building now"
        ],
        "allow_other": True
    },
    {
        "id": 24,
        "pillar": "O",
        "title_np": "तीन वर्षे लक्ष्य",
        "title_en": "3 Year Goal",
        "question_np": "लगानी पछि ३ वर्षमा कहाँ पुग्ने लक्ष्य छ?",
        "question_en": "Where do you want to be in 3 years after investment?",
        "hint": "Nepal example: '3 years: all provinces, 5,000+ farmers, NPR 50M annual revenue.'",
        "options": [
            "नेपालका मुख्य सहरमा विस्तार / Expand to major cities of Nepal",
            "नेपालभर सेवा / Reach all of Nepal",
            "दक्षिण एशियामा विस्तार / Expand to South Asia",
            "निर्दिष्ट ग्राहक / राजस्व लक्ष्य / Specific customer count or revenue target",
            "सरकार / संस्थासँग साझेदारी / Government or institutional partnership",
            "कम्पनी बेच्ने / NEPSE मा सूचीकृत / Sell the company or list on NEPSE"
        ],
        "allow_other": True
    },
    {
        "id": 25,
        "pillar": "O",
        "title_np": "फिनलॉजिक उपयुक्तता",
        "title_en": "Finlogic Fit",
        "question_np": "Finlogic Capital ले तपाईंमा लगानी गर्नु किन सही हुनेछ?",
        "question_en": "Why would Finlogic Capital investing in you be the right decision?",
        "hint": "This is your open answer — say whatever feels right. In Nepali or English. There is no wrong answer.",
        "options": [
            "हाम्रो टोली यो समस्या सुल्झाउन सबैभन्दा उपयुक्त / Our team is uniquely suited to solve this problem",
            "बजारको समय एकदम सही / The timing is perfect — this opportunity will not last",
            "प्रतिस्पर्धीसँग नभएको विशेष फाइदा / We have an unfair advantage competitors lack",
            "नेपाली समाजमा वास्तविक परिवर्तन ल्याउँछ / Our product brings real positive change to Nepal",
            "Finlogic को नेटवर्कले व्यवसाई बढाउन मद्दत / Finlogic's network will accelerate our growth significantly"
        ],
        "allow_other": True
    }
]
