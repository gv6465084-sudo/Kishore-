import type { AssessmentCategory, LanguageCode } from '../types/analysis';

export interface TranslationDict {
  brand: string;
  tagline: string;
  nav: {
    home: string;
    dashboard: string;
    news: string;
    image: string;
    video: string;
    result: string;
    report: string;
    about: string;
    privacy: string;
    settings: string;
  };
  topbar: {
    openWorkspace: string;
    searchPlaceholder: string;
    langEnglish: string;
    langTamil: string;
    lightMode: string;
    darkMode: string;
  };
  assessments: Record<AssessmentCategory, string>;
  assessmentDescriptions: Record<AssessmentCategory, string>;
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    heroPrimaryCta: string;
    heroSecondaryCta: string;
    introHeading: string;
    introBody: string;
    modulesHeading: string;
    modulesSubheading: string;
    moduleNewsTitle: string;
    moduleNewsDesc: string;
    moduleImageTitle: string;
    moduleImageDesc: string;
    moduleVideoTitle: string;
    moduleVideoDesc: string;
    howItWorksHeading: string;
    steps: Array<{ title: string; desc: string }>;
    featuresHeading: string;
    features: Array<{ title: string; desc: string }>;
    privacyHeading: string;
    privacyBody: string;
    footerNote: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalAnalyses: string;
    newsAnalyses: string;
    imageAnalyses: string;
    videoAnalyses: string;
    distributionTitle: string;
    recentActivityTitle: string;
    moduleShortcutsTitle: string;
    privacyStatusTitle: string;
    privacyStatusBody: string;
    emptyTitle: string;
    emptyBody: string;
    startNewsCheck: string;
    startImageCheck: string;
    startVideoCheck: string;
    clearSession: string;
    tableSubject: string;
    tableModule: string;
    tableAssessment: string;
    tableConfidence: string;
    tableAction: string;
    inspect: string;
    capabilitiesTitle: string;
  };
  news: {
    title: string;
    subtitle: string;
    modeArticle: string;
    modeHeadline: string;
    modeSocial: string;
    modeUrl: string;
    inputLabelText: string;
    inputLabelUrl: string;
    placeholderText: string;
    placeholderUrl: string;
    analyzeButton: string;
    analyzing: string;
    samplesLabel: string;
    sampleEnglishClaim: string;
    sampleTamilClaim: string;
    sampleMisleading: string;
    sampleContradicted: string;
    guideTitle: string;
    guideSteps: string[];
    extractedClaims: string;
    namedEntities: string;
    manipulationSignals: string;
    unsupportedNumbers: string;
  };
  image: {
    title: string;
    subtitle: string;
    dropPrompt: string;
    dropHint: string;
    selectFile: string;
    analyzeButton: string;
    analyzing: string;
    previewTabOriginal: string;
    previewTabEla: string;
    previewTabSplit: string;
    metadataTitle: string;
    formatLabel: string;
    dimensionsLabel: string;
    fileSizeLabel: string;
    exifLabel: string;
    exifPresent: string;
    exifAbsent: string;
    elaMetricsTitle: string;
    specialisedClassifierTitle: string;
  };
  video: {
    title: string;
    subtitle: string;
    dropPrompt: string;
    dropHint: string;
    selectFile: string;
    analyzeButton: string;
    analyzing: string;
    containerMetadata: string;
    contactSheetTitle: string;
    framesTitle: string;
    trackVisual: string;
    trackDeepfake: string;
    trackAudio: string;
    trackLipSync: string;
  };
  result: {
    title: string;
    noResultTitle: string;
    noResultBody: string;
    selectSessionItem: string;
    summaryHeading: string;
    explanationHeading: string;
    indicatorsHeading: string;
    evidenceStrength: string;
    sourceReliability: string;
    modelConfidence: string;
    forensicAnomalies: string;
    verificationStatus: string;
    findingsHeading: string;
    evidenceHeading: string;
    noEvidenceNote: string;
    supportingLabel: string;
    contradictingLabel: string;
    contextualLabel: string;
    limitationsHeading: string;
    nextStepsHeading: string;
    openReportPreview: string;
  };
  report: {
    title: string;
    subtitle: string;
    downloadPdf: string;
    downloadJson: string;
    downloadMarkdown: string;
    downloading: string;
    noReportTitle: string;
    noReportBody: string;
  };
  about: {
    title: string;
    subtitle: string;
    missionHeading: string;
    missionBody: string;
    principlesHeading: string;
    principles: Array<{ title: string; body: string }>;
  };
  privacy: {
    title: string;
    subtitle: string;
    ephemeralHeading: string;
    ephemeralPoints: string[];
    externalHeading: string;
    externalBody: string;
    localArchitectureHeading: string;
    localArchitectureBody: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageHeading: string;
    languageDesc: string;
    themeHeading: string;
    themeDesc: string;
    backendStatusHeading: string;
    sessionDataHeading: string;
    sessionDataDesc: string;
  };
  common: {
    errorPrefix: string;
    confidence: string;
    available: string;
    unavailable: string;
    configured: string;
    notConfigured: string;
    fileTooLarge: string;
    invalidFileType: string;
  };
}

export const translations: Record<LanguageCode, TranslationDict> = {
  en: {
    brand: 'TruthScan AI',
    tagline: 'Verify the Content. Reveal the Evidence. Protect the Truth.',
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      news: 'NewsCheck',
      image: 'ImageCheck',
      video: 'VideoCheck',
      result: 'Analysis Result',
      report: 'Report Preview',
      about: 'About',
      privacy: 'Privacy Policy',
      settings: 'Settings',
    },
    topbar: {
      openWorkspace: 'Open Workspace',
      searchPlaceholder: 'Filter session analyses...',
      langEnglish: 'EN',
      langTamil: 'தமிழ்',
      lightMode: 'Light',
      darkMode: 'Dark',
    },
    assessments: {
      Verified: 'Verified',
      Contradicted: 'Contradicted',
      Misleading: 'Misleading',
      Suspicious: 'Suspicious',
      Inconclusive: 'Inconclusive',
    },
    assessmentDescriptions: {
      Verified: 'Strong supporting evidence retrieved from independent, reliable sources.',
      Contradicted: 'Reliable external evidence directly contradicts the primary claim.',
      Misleading: 'Contains factual elements but omits essential context or distorts framing.',
      Suspicious: 'Forensic or linguistic indicators warrant independent verification.',
      Inconclusive: 'Insufficient reliable evidence to establish authenticity or accuracy.',
    },
    landing: {
      heroTitle: 'Verify digital claims, images, and video with transparent forensic evidence.',
      heroSubtitle:
        'TruthScan AI investigates suspicious news in English and Tamil, inspects image metadata and compression residuals, and extracts video frames for multimodal verification—without storing your uploaded content.',
      heroPrimaryCta: 'Launch Verification Workspace',
      heroSecondaryCta: 'Explore Privacy Architecture',
      introHeading: 'Built for evidence-first investigation, not opaque scores.',
      introBody:
        'Automated tools should never declare media fake from a single heuristic. TruthScan AI separates retrieved external sources, forensic signals, model limitations, and recommended human checks into clear audit trails.',
      modulesHeading: 'Three specialized verification modules',
      modulesSubheading: 'Inspect text claims, still imagery, and video containers in a unified workflow.',
      moduleNewsTitle: '01. NewsCheck',
      moduleNewsDesc:
        'Extracts discrete claims, checks Google Fact Check Tools and live web grounding sources, detects manipulative framing, and compares supporting vs. contradicting evidence in English and Tamil.',
      moduleImageTitle: '02. ImageCheck',
      moduleImageDesc:
        'Verifies file signatures, reads EXIF camera headers, computes exploratory Error Level Analysis (ELA) heatmaps, runs optional specialised classifiers, and inspects visual physics.',
      moduleVideoTitle: '03. VideoCheck',
      moduleVideoDesc:
        'Validates video containers via FFprobe, extracts timestamped frames with FFmpeg, builds a contact sheet, and separates visual, deepfake, audio, and lip-sync track statuses.',
      howItWorksHeading: 'How verification works',
      steps: [
        {
          title: '01. Submit & Validate',
          desc: 'Inputs and uploads are checked for size, magic-byte file signatures, and prompt-injection safety before processing.',
        },
        {
          title: '02. Forensic & Claim Extraction',
          desc: 'Text claims, EXIF headers, ELA compression maps, or FFmpeg key frames are extracted ephemerally in memory and temporary storage.',
        },
        {
          title: '03. Grounded Evidence & Multimodal Review',
          desc: 'External fact-checks, web grounding sources, and multimodal AI analysis are cross-checked without fabricating citations.',
        },
        {
          title: '04. Explainable Report & Cleanup',
          desc: 'Structured findings export to PDF, JSON, or Markdown while all temporary server files are deleted immediately.',
        },
      ],
      featuresHeading: 'Security and engineering discipline',
      features: [
        {
          title: 'Zero Permanent Storage',
          desc: 'No database, no S3 bucket, and no server-side scan history. Temporary media directories are purged in finally blocks.',
        },
        {
          title: 'Bilingual English & Tamil',
          desc: 'Full interface localization and Unicode-safe Tamil news analysis with localized explanations and reports.',
        },
        {
          title: 'Honest Model Availability',
          desc: 'Specialised deepfake or image classifiers clearly report unavailable status when unconfigured instead of faking scores.',
        },
        {
          title: 'Untrusted Input Hardening',
          desc: 'SSRF URL filtering, 20 MB upload caps, rate limiting, and explicit data delimiters protect against embedded prompt attacks.',
        },
      ],
      privacyHeading: 'Ephemeral processing by default',
      privacyBody:
        'Uploaded files exist only for the duration of the active request and are deleted automatically afterward. Content sent to hosted AI or search providers remains subject to those providers’ published data-handling policies.',
      footerNote: 'TruthScan AI — Evidence-Aware Digital Verification Platform',
    },
    dashboard: {
      title: 'Verification Session Dashboard',
      subtitle: 'Metrics reflect analyses performed during this browser session only. Zero server persistence.',
      totalAnalyses: 'Session Analyses',
      newsAnalyses: 'News Checks',
      imageAnalyses: 'Image Forensics',
      videoAnalyses: 'Video Checks',
      distributionTitle: 'Assessment Distribution',
      recentActivityTitle: 'Recent Session Activity',
      moduleShortcutsTitle: 'Verification Modules',
      privacyStatusTitle: 'Privacy & Ephemeral Storage',
      privacyStatusBody:
        'Active mode: In-memory browser session only. No database or persistent media archive is connected.',
      emptyTitle: 'No analyses recorded in this session yet',
      emptyBody:
        'Start by verifying a news claim, inspecting an image for forensic metadata and ELA residuals, or extracting video frames.',
      startNewsCheck: 'Start NewsCheck',
      startImageCheck: 'Start ImageCheck',
      startVideoCheck: 'Start VideoCheck',
      clearSession: 'Clear Session',
      tableSubject: 'Subject',
      tableModule: 'Module',
      tableAssessment: 'Assessment',
      tableConfidence: 'Confidence',
      tableAction: 'Action',
      inspect: 'Inspect',
      capabilitiesTitle: 'Backend Engine Capabilities',
    },
    news: {
      title: 'NewsCheck — Claim & Evidence Verification',
      subtitle: 'Analyze articles, headlines, social posts, or URLs in English and Tamil against retrieved evidence.',
      modeArticle: 'News Article',
      modeHeadline: 'Headline',
      modeSocial: 'Social Post',
      modeUrl: 'Article URL',
      inputLabelText: 'Content to investigate',
      inputLabelUrl: 'News article URL (http:// or https://)',
      placeholderText: 'Paste an English or Tamil news article, headline, or social media post...',
      placeholderUrl: 'https://example.com/news-story',
      analyzeButton: 'Verify News Claims',
      analyzing: 'Retrieving evidence and analyzing claims...',
      samplesLabel: 'Sample test inputs:',
      sampleEnglishClaim: 'Verified Fact Sample',
      sampleTamilClaim: 'Tamil Claim Sample',
      sampleMisleading: 'Unverified Rumor Sample',
      sampleContradicted: 'False Claim Sample',
      guideTitle: 'How to check if news is true or false',
      guideSteps: [
        'Paste a specific factual news claim, headline, social post, or article URL (short generic notes without testable facts return Inconclusive).',
        'TruthScan AI cross-checks claims against free open references (Wikipedia, Google News RSS), optional Google Fact Check API, and any Reference URLs you paste.',
        'Read the badge & evidence list: Verified = confirmed by independent sources; Contradicted / Misleading = refuted or distorted; Suspicious = scam/panic framing without proof; Inconclusive = insufficient evidence.',
      ],
      extractedClaims: 'Extracted Factual Claims',
      namedEntities: 'Named Entities',
      manipulationSignals: 'Linguistic & Manipulation Signals',
      unsupportedNumbers: 'Unsupported Numerical Claims',
    },
    image: {
      title: 'ImageCheck — Metadata & Forensic Inspection',
      subtitle: 'Upload JPG, JPEG, PNG, or WebP images (max 20 MB) for EXIF inspection, ELA visualization, and multimodal review.',
      dropPrompt: 'Drag and drop an image here, or choose a file',
      dropHint: 'JPG, JPEG, PNG, WebP · Maximum 20 MB · Deleted immediately after analysis',
      selectFile: 'Select Image',
      analyzeButton: 'Run Image Forensics',
      analyzing: 'Inspecting EXIF headers, computing ELA map, and analyzing visual cues...',
      previewTabOriginal: 'Original',
      previewTabEla: 'ELA Heatmap',
      previewTabSplit: 'Side-by-Side',
      metadataTitle: 'Technical & EXIF Metadata',
      formatLabel: 'Format',
      dimensionsLabel: 'Dimensions',
      fileSizeLabel: 'File Size',
      exifLabel: 'EXIF Status',
      exifPresent: 'Present',
      exifAbsent: 'Not Present',
      elaMetricsTitle: 'Error Level Analysis (Exploratory)',
      specialisedClassifierTitle: 'Specialised AI-Image Classifier',
    },
    video: {
      title: 'VideoCheck — Frame Extraction & Deepfake Triage',
      subtitle: 'Upload MP4, MOV, WEBM, or M4V clips (max 20 MB) for FFmpeg frame extraction and multi-track evaluation.',
      dropPrompt: 'Drag and drop a video clip here, or choose a file',
      dropHint: 'MP4, MOV, WEBM, M4V · Maximum 20 MB · Processed in ephemeral temp directory',
      selectFile: 'Select Video',
      analyzeButton: 'Extract Frames & Verify Video',
      analyzing: 'Running FFprobe, extracting key frames with FFmpeg, and inspecting tracks...',
      containerMetadata: 'Container & Stream Metadata',
      contactSheetTitle: 'Extracted Frame Contact Sheet',
      framesTitle: 'Timestamped Sample Frames',
      trackVisual: '01. General Visual Analysis',
      trackDeepfake: '02. Specialised Deepfake Detection',
      trackAudio: '03. Audio Stream Analysis',
      trackLipSync: '04. Lip-Synchronisation Analysis',
    },
    result: {
      title: 'Analysis Result Inspector',
      noResultTitle: 'No active analysis selected',
      noResultBody: 'Run a verification in NewsCheck, ImageCheck, or VideoCheck to inspect detailed indicators and citations.',
      selectSessionItem: 'Session Item',
      summaryHeading: 'Executive Summary',
      explanationHeading: 'Evidence-Based Explanation',
      indicatorsHeading: 'Explainable Assessment Indicators',
      evidenceStrength: 'Evidence Strength',
      sourceReliability: 'Source Reliability',
      modelConfidence: 'Model Confidence',
      forensicAnomalies: 'Forensic Anomalies',
      verificationStatus: 'Verification Status',
      findingsHeading: 'Detailed Findings',
      evidenceHeading: 'Retrieved Evidence & Citations',
      noEvidenceNote: 'No external URL citations returned for this media-only or uncorroborated check.',
      supportingLabel: 'Supporting',
      contradictingLabel: 'Contradicting',
      contextualLabel: 'Contextual',
      limitationsHeading: 'Known Limitations',
      nextStepsHeading: 'Recommended Next Steps',
      openReportPreview: 'Preview & Export Report',
    },
    report: {
      title: 'Verification Report Preview',
      subtitle: 'Reports are generated on demand from your current browser session and are never archived on the server.',
      downloadPdf: 'Download PDF',
      downloadJson: 'Download JSON',
      downloadMarkdown: 'Download Markdown',
      downloading: 'Generating report...',
      noReportTitle: 'No analysis available to export',
      noReportBody: 'Complete any NewsCheck, ImageCheck, or VideoCheck analysis first to generate a downloadable report.',
    },
    about: {
      title: 'About TruthScan AI',
      subtitle: 'Explainable digital verification combining retrieval, forensic signal extraction, and multimodal reasoning.',
      missionHeading: 'Verification Philosophy',
      missionBody:
        'Disinformation and synthetic media exploit speed and ambiguity. TruthScan AI is designed around disciplined restraint: we distinguish verified facts, direct contradictions, missing context, suspicious forensic signals, and genuine uncertainty.',
      principlesHeading: 'Core Architectural Principles',
      principles: [
        {
          title: 'Never Claim Certainty From a Single Heuristic',
          body: 'Missing EXIF metadata or high-contrast Error Level Analysis edges never trigger an automatic fake verdict.',
        },
        {
          title: 'Zero Fabricated Citations',
          body: 'News verification links only to real URLs returned by Google Fact Check Tools API or grounded web search results.',
        },
        {
          title: 'Transparent Model Scope',
          body: 'When specialised deepfake or synthetic-image models are not configured in Free Mode, the platform explicitly marks those tracks unavailable instead of faking scores.',
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy & Data Handling',
      subtitle: 'Privacy-first architecture engineered for ephemeral verification without permanent storage.',
      ephemeralHeading: 'What TruthScan AI Does Not Store',
      ephemeralPoints: [
        'No permanent database (no PostgreSQL, MongoDB, or Firebase) stores your claims, URLs, or results.',
        'Uploaded images and videos are validated in memory and cleaned up immediately in server finally blocks after analysis.',
        'Extracted video frames and ELA heatmaps exist only transiently in the active response and browser session memory.',
        'Server logs do not record uploaded media payloads or full submitted article contents.',
      ],
      externalHeading: 'External AI & Search Provider Notice',
      externalBody:
        'When verification invokes free-tier hosted APIs such as Google Gemini, Google Search Grounding, or optional Google Fact Check Tools, the submitted text or extracted frames are transmitted to those services and are subject to their respective provider data-handling policies.',
      localArchitectureHeading: 'Strict Local-Only Readiness',
      localArchitectureBody:
        'The modular service layer supports routing inference to locally hosted vision-language and forensic classifiers when an organization requires zero external network egress.',
    },
    settings: {
      title: 'Workspace Settings',
      subtitle: 'Configure interface language, visual theme, and inspect active backend capabilities.',
      languageHeading: 'Interface & Analysis Language',
      languageDesc: 'Controls both UI labels and the language used for AI verification explanations.',
      themeHeading: 'Appearance Theme',
      themeDesc: 'Switch between dark cybersecurity mode and high-contrast light mode.',
      backendStatusHeading: 'Server Capabilities & Diagnostics',
      sessionDataHeading: 'Browser Session Memory',
      sessionDataDesc: 'All analysis results remain solely in temporary browser memory for your current session.',
    },
    common: {
      errorPrefix: 'Verification error:',
      confidence: 'Confidence',
      available: 'Available',
      unavailable: 'Unavailable',
      configured: 'Configured',
      notConfigured: 'Not configured',
      fileTooLarge: 'Selected file exceeds the 20 MB maximum upload limit.',
      invalidFileType: 'Unsupported file format selected.',
    },
  },
  ta: {
    brand: 'TruthScan AI',
    tagline: 'உள்ளடக்கத்தைச் சரிபார்க்கவும். ஆதாரத்தை வெளிப்படுத்தவும். உண்மையைப் பாதுகாக்கவும்.',
    nav: {
      home: 'முகப்பு',
      dashboard: 'டாஷ்போர்டு',
      news: 'செய்தி சரிபார்ப்பு',
      image: 'பட சரிபார்ப்பு',
      video: 'காணொளி சரிபார்ப்பு',
      result: 'பகுப்பாய்வு முடிவு',
      report: 'அறிக்கை முன்னோட்டம்',
      about: 'பற்றி',
      privacy: 'தனியுரிமைக் கொள்கை',
      settings: 'அமைப்புகள்',
    },
    topbar: {
      openWorkspace: 'பணியிடத்தைத் திற',
      searchPlaceholder: 'அமர்வு முடிவுகளைத் தேடுக...',
      langEnglish: 'EN',
      langTamil: 'தமிழ்',
      lightMode: 'வெளிச்சம்',
      darkMode: 'இருள்',
    },
    assessments: {
      Verified: 'உறுதிப்படுத்தப்பட்டது',
      Contradicted: 'மறுக்கப்பட்டது',
      Misleading: 'தவறாக வழிநடத்தும்',
      Suspicious: 'சந்தேகத்திற்கிடமானது',
      Inconclusive: 'முடிவு செய்ய முடியாதது',
    },
    assessmentDescriptions: {
      Verified: 'நம்பகமான சுயாதீன ஆதாரங்களில் இருந்து வலுவான சான்றுகள் கிடைத்துள்ளன.',
      Contradicted: 'நம்பகமான வெளிப்புற ஆதாரங்கள் இந்தக் கூற்றை நேரடியாக மறுக்கின்றன.',
      Misleading: 'உண்மையான தகவல்கள் இருந்தாலும் முக்கிய பின்னணி தவிர்க்கப்பட்டுள்ளது.',
      Suspicious: 'தடயவியல் அல்லது மொழி அறிகுறிகள் கூடுதல் சரிபார்ப்பைத் தேவைப்படுத்துகின்றன.',
      Inconclusive: 'உண்மைத்தன்மையை உறுதிப்படுத்த போதுமான நம்பகமான ஆதாரம் இல்லை.',
    },
    landing: {
      heroTitle: 'தெளிவான தடயவியல் ஆதாரங்களுடன் செய்திகள், படங்கள் மற்றும் காணொளிகளைச் சரிபார்க்கவும்.',
      heroSubtitle:
        'ஆங்கிலம் மற்றும் தமிழ் செய்திகளை ஆய்வு செய்யவும், படங்களின் EXIF மற்றும் ELA தடயங்களைப் பரிசோதிக்கவும், காணொளி பிரேம்களைப் பிரித்தெடுக்கவும் — உங்கள் கோப்புகளை நிரந்தரமாகச் சேமிக்காமல் செயல்படும் தளம்.',
      heroPrimaryCta: 'சரிபார்ப்பு பணியிடத்தைத் திற',
      heroSecondaryCta: 'தனியுரிமை கட்டமைப்பைப் பார்க்க',
      introHeading: 'வெறும் மதிப்பெண்களுக்குப் பதிலாக ஆதார அடிப்படையிலான ஆய்வு.',
      introBody:
        'ஒரு AI மதிப்பெண்ணை மட்டும் கொண்டு எதையும் போலியானது எனத் தீர்மானிக்கக் கூடாது. TruthScan AI ஆதாரங்கள், தடயவியல் அறிகுறிகள், வரம்புகள் மற்றும் அடுத்த படிகளைத் தெளிவாகப் பிரிக்கிறது.',
      modulesHeading: 'மூன்று சிறப்பு சரிபார்ப்பு தொகுதிகள்',
      modulesSubheading: 'செய்திகள், படங்கள் மற்றும் காணொளிகளை ஒரே தளத்தில் ஆய்வு செய்யவும்.',
      moduleNewsTitle: '01. செய்தி சரிபார்ப்பு (NewsCheck)',
      moduleNewsDesc:
        'முக்கிய கூற்றுகளைப் பிரித்தெடுத்து, Google Fact Check மற்றும் இணைய ஆதாரங்களுடன் ஒப்பிட்டு ஆங்கிலம் மற்றும் தமிழில் விளக்குகிறது.',
      moduleImageTitle: '02. பட சரிபார்ப்பு (ImageCheck)',
      moduleImageDesc:
        'கோப்பு கையொப்பம், EXIF மெட்டாடேட்டா, பிழை நிலை பகுப்பாய்வு (ELA) வரைபடம் மற்றும் காட்சி முரண்பாடுகளை ஆராய்கிறது.',
      moduleVideoTitle: '03. காணொளி சரிபார்ப்பு (VideoCheck)',
      moduleVideoDesc:
        'FFprobe மூலம் விவரங்களைப் படித்து, FFmpeg மூலம் பிரேம்களைப் பிரித்து காட்சி, டீப்ஃபேக், ஒலி மற்றும் உதடு ஒத்திசைவு நிலைகளைத் தனித்தனியாகக் காட்டுகிறது.',
      howItWorksHeading: 'சரிபார்ப்பு செயல்முறை',
      steps: [
        {
          title: '01. சமர்ப்பிப்பு & பாதுகாப்பு சோதனை',
          desc: 'கோப்பு அளவு, பைட் கையொப்பம் மற்றும் பாதுகாப்பு வடிகட்டிகள் மூலம் உள்ளீடுகள் சரிபார்க்கப்படுகின்றன.',
        },
        {
          title: '02. தடயவியல் & கூற்று பிரித்தெடுத்தல்',
          desc: 'கூற்றுகள், EXIF தரவு, ELA வரைபடம் அல்லது FFmpeg பிரேம்கள் தற்காலிக நினைவகத்தில் பிரித்தெடுக்கப்படுகின்றன.',
        },
        {
          title: '03. ஆதார ஒப்பீடு & AI பகுப்பாய்வு',
          desc: 'உண்மைச் சரிபார்ப்பு API மற்றும் இணைய ஆதாரங்களுடன் ஒப்பிட்டு பொய்யான இணைப்புகள் இல்லாமல் விளக்கம் அளிக்கப்படுகிறது.',
        },
        {
          title: '04. அறிக்கை & உடனடி நீக்கம்',
          desc: 'PDF, JSON அல்லது Markdown அறிக்கைகளைப் பதிவிறக்கலாம்; அனைத்து தற்காலிக கோப்புகளும் உடனடியாக அழிக்கப்படுகின்றன.',
        },
      ],
      featuresHeading: 'பாதுகாப்பு மற்றும் பொறியியல் சிறப்புகள்',
      features: [
        {
          title: 'நிரந்தர சேமிப்பு இல்லை',
          desc: 'தரவுத்தளம் அல்லது மேகக்கணி சேமிப்பு இல்லை. ஒவ்வொரு ஆய்வுக்குப் பிறகும் தற்காலிக கோப்புகள் நீக்கப்படும்.',
        },
        {
          title: 'ஆங்கிலம் & தமிழ் இருமொழி ஆதரவு',
          desc: 'முழு இடைமுக மொழிபெயர்ப்பு மற்றும் தமிழ் செய்திகளை யூனிகோட் முறையில் துல்லியமாக ஆய்வு செய்யும் வசதி.',
        },
        {
          title: 'நேர்மையான மாதிரி நிலை',
          desc: 'சிறப்பு டீப்ஃபேக் மாதிரி இணைக்கப்படாதபோது போலி முடிவுகளைக் காட்டாமல் கிடைக்கவில்லை எனத் தெளிவாகத் தெரிவிக்கும்.',
        },
        {
          title: 'பாதுகாப்பு கவசம்',
          desc: 'SSRF பாதுகாப்பு, 20 MB வரம்பு, வேகக் கட்டுப்பாடு மற்றும் தீங்கிழைக்கும் உள்ளீடுகளுக்கு எதிரான பாதுகாப்பு.',
        },
      ],
      privacyHeading: 'தற்காலிக செயலாக்கம் மட்டுமே',
      privacyBody:
        'பதிவேற்றப்படும் கோப்புகள் ஆய்வு நேரத்தில் மட்டுமே பயன்படுத்தப்பட்டு உடனடியாக நீக்கப்படும். வெளிப்புற AI சேவைகளுக்கு அனுப்பப்படும் தகவல்கள் அந்தந்த சேவைகளின் தனியுரிமைக் கொள்கைக்கு உட்பட்டவை.',
      footerNote: 'TruthScan AI — ஆதார அடிப்படையிலான டிஜிட்டல் சரிபார்ப்பு தளம்',
    },
    dashboard: {
      title: 'சரிபார்ப்பு அமர்வு டாஷ்போர்டு',
      subtitle: 'இந்த உலாவி அமர்வில் செய்யப்பட்ட ஆய்வுகள் மட்டுமே காட்டப்படுகின்றன. சேவையக சேமிப்பு இல்லை.',
      totalAnalyses: 'மொத்த ஆய்வுகள்',
      newsAnalyses: 'செய்தி ஆய்வுகள்',
      imageAnalyses: 'பட ஆய்வுகள்',
      videoAnalyses: 'காணொளி ஆய்வுகள்',
      distributionTitle: 'முடிவுகளின் பரவல்',
      recentActivityTitle: 'சமீபத்திய அமர்வு செயல்பாடுகள்',
      moduleShortcutsTitle: 'சரிபார்ப்பு தொகுதிகள்',
      privacyStatusTitle: 'தனியுரிமை & தற்காலிக நிலை',
      privacyStatusBody: 'செயலில்: உலாவி நினைவகம் மட்டுமே. நிரந்தர தரவுத்தளம் இணைக்கப்படவில்லை.',
      emptyTitle: 'இந்த அமர்வில் இன்னும் ஆய்வுகள் எதுவும் இல்லை',
      emptyBody: 'செய்தி கூற்றைச் சரிபார்க்கவும், படத்தின் தடயவியலைப் பார்க்கவும் அல்லது காணொளியை ஆய்வு செய்யவும் தொடங்கவும்.',
      startNewsCheck: 'செய்தி சரிபார்ப்பு',
      startImageCheck: 'பட சரிபார்ப்பு',
      startVideoCheck: 'காணொளி சரிபார்ப்பு',
      clearSession: 'அமர்வை அழி',
      tableSubject: 'பொருள்',
      tableModule: 'தொகுதி',
      tableAssessment: 'மதிப்பீடு',
      tableConfidence: 'நம்பகத்தன்மை',
      tableAction: 'செயல்',
      inspect: 'பார்க்க',
      capabilitiesTitle: 'சேவையக இயந்திர நிலை',
    },
    news: {
      title: 'செய்தி சரிபார்ப்பு (NewsCheck)',
      subtitle: 'ஆங்கிலம் மற்றும் தமிழ் செய்திகள், தலைப்புகள், சமூக ஊடகப் பதிவுகள் அல்லது இணைய இணைப்புகளைச் சரிபார்க்கவும்.',
      modeArticle: 'செய்திக் கட்டுரை',
      modeHeadline: 'தலைப்பு',
      modeSocial: 'சமூக பதிவு',
      modeUrl: 'செய்தி URL',
      inputLabelText: 'ஆய்வு செய்ய வேண்டிய உள்ளடக்கம்',
      inputLabelUrl: 'செய்தி இணைப்பு (http:// அல்லது https://)',
      placeholderText: 'ஆங்கிலம் அல்லது தமிழ் செய்திக் கட்டுரை, தலைப்பு அல்லது சமூக ஊடகப் பதிவை இங்கே ஒட்டவும்...',
      placeholderUrl: 'https://example.com/news-story',
      analyzeButton: 'செய்தியைச் சரிபார்',
      analyzing: 'ஆதாரங்களைத் தேடி கூற்றுகளை ஆய்வு செய்கிறது...',
      samplesLabel: 'மாதிரி உள்ளீடுகள்:',
      sampleEnglishClaim: 'ஆங்கில உண்மை மாதிரி',
      sampleTamilClaim: 'தமிழ் செய்தி மாதிரி',
      sampleMisleading: 'சரிபார்க்கப்படாத வதந்தி',
      sampleContradicted: 'தவறான தகவல் மாதிரி',
      guideTitle: 'செய்தி உண்மையா அல்லது பொய்யா என எவ்வாறு சரிபார்ப்பது?',
      guideSteps: [
        'ஒரு குறிப்பிட்ட செய்திக் கூற்று, தலைப்பு, சமூகப் பதிவு அல்லது செய்தி URL-ஐ உள்ளிடவும் (சோதிக்கக்கூடிய தகவல் இல்லாத பொதுவான சொற்றொடர்கள் "முடிவு செய்ய முடியாதது" என வரும்).',
        'TruthScan AI இலவச திறந்த ஆதாரங்கள் (விக்கிபீடியா, Google News RSS), விருப்பமான Fact Check API மற்றும் நீங்கள் சேர்க்கும் ஆதார இணைப்புகளுடன் ஒப்பிட்டுப் பார்க்கும்.',
        'முடிவுகளைப் புரிந்துகொள்ளுங்கள்: உறுதிப்படுத்தப்பட்டது (Verified) = ஆதாரம் உள்ளது; மறுக்கப்பட்டது/தவறானது (Contradicted/Misleading) = ஆதாரத்திற்கு எதிரானது; சந்தேகத்திற்கிடமானது (Suspicious) = ஆதாரமற்ற பரபரப்பு; முடிவு செய்ய முடியாதது (Inconclusive) = போதிய ஆதாரம் இல்லை.',
      ],
      extractedClaims: 'பிரித்தெடுக்கப்பட்ட கூற்றுகள்',
      namedEntities: 'பெயரிடப்பட்ட நிறுவனங்கள் / நபர்கள்',
      manipulationSignals: 'மொழி மற்றும் உணர்ச்சித் தூண்டல் அறிகுறிகள்',
      unsupportedNumbers: 'ஆதாரமற்ற எண் தகவல்கள்',
    },
    image: {
      title: 'பட சரிபார்ப்பு (ImageCheck)',
      subtitle: 'JPG, JPEG, PNG அல்லது WebP படங்களை (அதிகபட்சம் 20 MB) EXIF, ELA மற்றும் காட்சி ஆய்வுக்குப் பதிவேற்றவும்.',
      dropPrompt: 'படத்தை இங்கே இழுத்து விடவும் அல்லது கோப்பைத் தேர்ந்தெடுக்கவும்',
      dropHint: 'JPG, JPEG, PNG, WebP · அதிகபட்சம் 20 MB · ஆய்வுக்குப் பின் உடனடியாக நீக்கப்படும்',
      selectFile: 'படத்தைத் தேர்ந்தெடு',
      analyzeButton: 'படத்தை ஆய்வு செய்',
      analyzing: 'EXIF தரவு, ELA வரைபடம் மற்றும் காட்சி முரண்பாடுகளை ஆய்வு செய்கிறது...',
      previewTabOriginal: 'அசல் படம்',
      previewTabEla: 'ELA வரைபடம்',
      previewTabSplit: 'இருபுற ஒப்பீடு',
      metadataTitle: 'தொழில்நுட்ப & EXIF விவரங்கள்',
      formatLabel: 'வடிவம்',
      dimensionsLabel: 'பரிமாணம்',
      fileSizeLabel: 'கோப்பு அளவு',
      exifLabel: 'EXIF நிலை',
      exifPresent: 'உள்ளது',
      exifAbsent: 'இல்லை',
      elaMetricsTitle: 'பிழை நிலை பகுப்பாய்வு (ஆய்வு உதவி)',
      specialisedClassifierTitle: 'சிறப்பு AI-பட வகைப்படுத்தி',
    },
    video: {
      title: 'காணொளி சரிபார்ப்பு (VideoCheck)',
      subtitle: 'MP4, MOV, WEBM அல்லது M4V காணொளிகளை (அதிகபட்சம் 20 MB) FFmpeg பிரேம் பகுப்பாய்வுக்குப் பதிவேற்றவும்.',
      dropPrompt: 'காணொளியை இங்கே இழுத்து விடவும் அல்லது கோப்பைத் தேர்ந்தெடுக்கவும்',
      dropHint: 'MP4, MOV, WEBM, M4V · அதிகபட்சம் 20 MB · தற்காலிக கோப்புறையில் செயலாக்கப்படும்',
      selectFile: 'காணொளியைத் தேர்ந்தெடு',
      analyzeButton: 'காணொளியை ஆய்வு செய்',
      analyzing: 'FFprobe மற்றும் FFmpeg மூலம் பிரேம்களைப் பிரித்தெடுத்து ஆய்வு செய்கிறது...',
      containerMetadata: 'காணொளி கோப்பு விவரங்கள்',
      contactSheetTitle: 'பிரேம் தொகுப்புத் தாள்',
      framesTitle: 'நேர முத்திரை பிரேம்கள்',
      trackVisual: '01. பொதுக் காட்சி பகுப்பாய்வு',
      trackDeepfake: '02. சிறப்பு டீப்ஃபேக் கண்டறிதல்',
      trackAudio: '03. ஒலிப் பாதை ஆய்வு',
      trackLipSync: '04. உதடு ஒத்திசைவு ஆய்வு',
    },
    result: {
      title: 'பகுப்பாய்வு முடிவு விவரம்',
      noResultTitle: 'செயலில் உள்ள ஆய்வு முடிவு இல்லை',
      noResultBody: 'விரிவான அறிகுறிகளையும் ஆதாரங்களையும் காண முதலில் ஒரு சரிபார்ப்பை இயக்கவும்.',
      selectSessionItem: 'அமர்வு ஆய்வு',
      summaryHeading: 'சுருக்கமான முடிவு',
      explanationHeading: 'ஆதார அடிப்படையிலான விளக்கம்',
      indicatorsHeading: 'விளக்கக்கூடிய மதிப்பீட்டு அறிகுறிகள்',
      evidenceStrength: 'ஆதார வலிமை',
      sourceReliability: 'ஆதார நம்பகத்தன்மை',
      modelConfidence: 'மாதிரி நம்பிக்கை',
      forensicAnomalies: 'தடயவியல் முரண்பாடுகள்',
      verificationStatus: 'சரிபார்ப்பு நிலை',
      findingsHeading: 'முக்கிய கண்டறிதல்கள்',
      evidenceHeading: 'பெறப்பட்ட ஆதாரங்கள் & இணைப்புகள்',
      noEvidenceNote: 'இந்த ஆய்வுக்கு வெளிப்புற இணைய இணைப்புகள் எதுவும் இல்லை.',
      supportingLabel: 'ஆதரிப்பது',
      contradictingLabel: 'மறுப்பது',
      contextualLabel: 'பின்னணி',
      limitationsHeading: 'அறியப்பட்ட வரம்புகள்',
      nextStepsHeading: 'பரிந்துரைக்கப்பட்ட அடுத்த படிகள்',
      openReportPreview: 'அறிக்கையைப் பார்க்க & பதிவிறக்க',
    },
    report: {
      title: 'சரிபார்ப்பு அறிக்கை முன்னோட்டம்',
      subtitle: 'அறிக்கைகள் உங்கள் தற்போதைய உலாவி அமர்வில் இருந்து உடனடியாக உருவாக்கப்படுகின்றன; சேவையகத்தில் சேமிக்கப்படுவதில்லை.',
      downloadPdf: 'PDF பதிவிறக்க',
      downloadJson: 'JSON பதிவிறக்க',
      downloadMarkdown: 'Markdown பதிவிறக்க',
      downloading: 'அறிக்கை உருவாக்கப்படுகிறது...',
      noReportTitle: 'ஏற்றுமதி செய்ய ஆய்வு எதுவும் இல்லை',
      noReportBody: 'அறிக்கையை உருவாக்க முதலில் செய்தி, படம் அல்லது காணொளி சரிபார்ப்பை இயக்கவும்.',
    },
    about: {
      title: 'TruthScan AI பற்றி',
      subtitle: 'ஆதாரத் தேடல், தடயவியல் தரவு மற்றும் AI விளக்கத்தை இணைக்கும் வெளிப்படையான சரிபார்ப்பு தளம்.',
      missionHeading: 'சரிபார்ப்பு தத்துவம்',
      missionBody:
        'தவறான தகவல்களையும் செயற்கை ஊடகங்களையும் பொறுப்புடன் ஆய்வு செய்ய TruthScan AI உருவாக்கப்பட்டது. உறுதிப்படுத்தப்பட்ட உண்மைகள், முரண்படும் ஆதாரங்கள் மற்றும் முடிவு செய்ய முடியாத நிலைகளைத் தெளிவாகப் பிரிக்கிறோம்.',
      principlesHeading: 'முக்கியக் கொள்கைகள்',
      principles: [
        {
          title: 'ஒரு அறிகுறியால் மட்டுமே தீர்மானிக்கக் கூடாது',
          body: 'EXIF இல்லாததாலோ ELA ஒளிர்வாலோ ஒரு படத்தைப் போலியானது எனத் தானாக அறிவிக்க மாட்டோம்.',
        },
        {
          title: 'பொய்யான இணைப்புகள் இல்லை',
          body: 'உண்மையான Fact Check API மற்றும் தேடல் ஆதாரங்களின் URL-களை மட்டுமே காண்பிக்கிறோம்.',
        },
        {
          title: 'வெளிப்படையான மாதிரி வரம்புகள்',
          body: 'சிறப்பு மாதிரிகள் அமைக்கப்படாதபோது கிடைக்கவில்லை என நேர்மையாகக் காண்பிக்கப்படும்.',
        },
      ],
    },
    privacy: {
      title: 'தனியுரிமைக் கொள்கை',
      subtitle: 'நிரந்தர சேமிப்பு இல்லாமல் தற்காலிக செயலாக்கத்திற்காக வடிவமைக்கப்பட்ட கட்டமைப்பு.',
      ephemeralHeading: 'நாங்கள் சேமிக்காத தகவல்கள்',
      ephemeralPoints: [
        'பயனர் செய்திகள், படங்கள், காணொளிகள் அல்லது ஆய்வு முடிவுகளைச் சேமிக்க எந்தத் தரவுத்தளமும் இல்லை.',
        'பதிவேற்றப்பட்ட கோப்புகள் ஆய்வு முடிந்தவுடன் உடனடியாக நீக்கப்படுகின்றன.',
        'உருவாக்கப்பட்ட பிரேம்கள் மற்றும் ELA வரைபடங்கள் தற்போதைய உலாவி அமர்வில் மட்டுமே இருக்கும்.',
        'சேவையகப் பதிவுகளில் பதிவேற்றப்பட்ட ஊடகங்கள் பதிவு செய்யப்படுவதில்லை.',
      ],
      externalHeading: 'வெளிப்புற AI சேவை அறிவிப்பு',
      externalBody:
        'Google Gemini, Google Search அல்லது விருப்பமான Google Fact Check Tools சேவைகளைப் பயன்படுத்தும்போது, அனுப்பப்படும் தரவு அந்தந்த நிறுவனங்களின் தனியுரிமை விதிகளுக்கு உட்பட்டது.',
      localArchitectureHeading: 'உள்ளூர் மாதிரி தயார்நிலை',
      localArchitectureBody:
        'வெளிப்புற இணையத் தொடர்பு இல்லாத சூழல்களில் உள்ளூர் மாதிரிகளை இணைக்கும் வகையில் சேவைக் கட்டமைப்பு பிரிக்கப்பட்டுள்ளது.',
    },
    settings: {
      title: 'பணியிட அமைப்புகள்',
      subtitle: 'மொழி, தோற்றம் மற்றும் சேவையகத் திறன்களை இங்கே நிர்வகிக்கவும்.',
      languageHeading: 'மொழித் தேர்வு',
      languageDesc: 'இடைமுக உரை மற்றும் AI பகுப்பாய்வு விளக்கங்களின் மொழியைத் தேர்ந்தெடுக்கவும்.',
      themeHeading: 'திரை தோற்றம்',
      themeDesc: 'இருள் மற்றும் வெளிச்சத் தோற்றங்களுக்கு இடையே மாறவும்.',
      backendStatusHeading: 'சேவையகத் திறன் நிலை',
      sessionDataHeading: 'உலாவி அமர்வு நினைவகம்',
      sessionDataDesc: 'அனைத்து முடிவுகளும் இந்த அமர்வின் தற்காலிக நினைவகத்தில் மட்டுமே வைக்கப்படுகின்றன.',
    },
    common: {
      errorPrefix: 'சரிபார்ப்பு பிழை:',
      confidence: 'நம்பகத்தன்மை',
      available: 'கிடைக்கிறது',
      unavailable: 'கிடைக்கவில்லை',
      configured: 'அமைக்கப்பட்டது',
      notConfigured: 'அமைக்கப்படவில்லை',
      fileTooLarge: 'தேர்ந்தெடுக்கப்பட்ட கோப்பு 20 MB வரம்பை மீறுகிறது.',
      invalidFileType: 'ஆதரிக்கப்படாத கோப்பு வடிவம்.',
    },
  },
};
