export interface TestQuestion {
  id: string
  question: string
  subtitle: string
  type: "single" | "multiple"
  icon: string
  helpText: string
  options: {
    value: string
    label: string
    description: string
    example: string
    icon: string
    detailedExplanation?: string
  }[]
}

export interface UserAnswers {
  dataType: string[]
  columnCount: string
  hasGroups: string
  goal: string
  testRelationships: string
  groupsPaired: string
  sampleSize: string
  dataSource: string
  analysisExperience: string
}

export interface TestRecommendation {
  name: string
  description: string
  realWorldExample: string
  whenToUse: string
  interpretation: string
  assumptions: string[]
  stepByStep: string[]
  link?: string
  confidence: number
  icon: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
}

export interface ScenarioExample {
  id: string
  title: string
  description: string
  icon: string
  recommendedTest: string
  difficulty: string
  industry: string
  dataDescription: string
  expectedOutcome: string
}

export const testQuestions: TestQuestion[] = [
  {
    id: "dataType",
    question: "What types of data do you have in your dataset?",
    subtitle: "Select all that apply - this helps us understand the nature of your information",
    icon: "📊",
    type: "multiple",
    helpText:
      "Understanding your data types is crucial for selecting the right statistical tests. Different tests work with different types of data. You can select multiple types if your dataset contains various kinds of information.",
    options: [
      {
        value: "numeric",
        label: "Numerical Data (Quantitative)",
        description: "Numbers that can be measured, counted, or calculated",
        example:
          "Age (25, 30, 45), Income ($50,000, $75,000), Test scores (85, 92, 78), Height (5.6 ft, 6.2 ft), Temperature (72°F, 85°F), Sales figures ($1,200, $2,500)",
        icon: "🔢",
        detailedExplanation:
          "Numerical data allows for mathematical operations like calculating averages, finding correlations, and performing regression analysis. This type of data is essential for most statistical tests.",
      },
      {
        value: "categorical",
        label: "Categorical Data (Qualitative)",
        description: "Data that represents categories, groups, or labels without numerical meaning",
        example:
          "Gender (Male, Female, Other), Education Level (High School, Bachelor's, Master's), Product Rating (Poor, Good, Excellent), Department (Sales, Marketing, HR), Color preferences (Red, Blue, Green)",
        icon: "🏷️",
        detailedExplanation:
          "Categorical data is used for grouping and classification. It's perfect for comparing groups, analyzing preferences, and understanding distributions across different categories.",
      },
      {
        value: "ordinal",
        label: "Ordinal Data (Ranked Categories)",
        description: "Categories with a meaningful order or ranking, but unequal intervals",
        example:
          "Satisfaction ratings (Very Dissatisfied, Dissatisfied, Neutral, Satisfied, Very Satisfied), Education levels (Elementary, High School, College, Graduate), Performance ratings (Poor, Fair, Good, Excellent)",
        icon: "📶",
        detailedExplanation:
          "Ordinal data has a natural order but the differences between categories aren't necessarily equal. This affects which statistical tests are appropriate.",
      },
      {
        value: "text",
        label: "Text & Written Content",
        description: "Written responses, comments, descriptions, or open-ended feedback",
        example:
          "Customer reviews ('Great product, highly recommend!'), Survey comments, Product descriptions, Email content, Social media posts, Interview transcripts",
        icon: "📝",
        detailedExplanation:
          "Text data requires special analysis techniques like sentiment analysis, word frequency analysis, or content categorization before statistical testing.",
      },
      {
        value: "time",
        label: "Time Series Data",
        description: "Data collected over time periods showing trends, patterns, or changes",
        example:
          "Monthly sales (Jan 2023: $10K, Feb 2023: $12K), Daily website visits, Stock prices over time, Temperature readings by hour, Quarterly revenue growth",
        icon: "📅",
        detailedExplanation:
          "Time series data has special properties like trends, seasonality, and autocorrelation that require specific analytical approaches and tests.",
      },
    ],
  },
  {
    id: "sampleSize",
    question: "How much data do you have to work with?",
    subtitle: "Sample size affects which statistical tests are appropriate and reliable",
    icon: "📏",
    type: "single",
    helpText:
      "Sample size is crucial for statistical analysis. Larger samples generally provide more reliable results and allow for more sophisticated analyses. Some tests require minimum sample sizes to be valid.",
    options: [
      {
        value: "small",
        label: "Small Dataset (Less than 30 records)",
        description: "Limited data points, requires careful test selection",
        example:
          "Survey responses from 25 customers, Test scores from one class of 20 students, Sales data from 15 stores",
        icon: "🔍",
        detailedExplanation:
          "Small samples limit your statistical options and may require non-parametric tests. Results should be interpreted cautiously, and effect sizes become more important than p-values.",
      },
      {
        value: "medium",
        label: "Medium Dataset (30-300 records)",
        description: "Moderate sample size suitable for most basic statistical tests",
        example:
          "Customer satisfaction survey with 150 responses, Employee performance data for 100 workers, Product quality measurements from 200 items",
        icon: "📊",
        detailedExplanation:
          "Medium samples allow for most standard statistical tests. You can detect moderate to large effects reliably, and assumptions of normality become less critical due to the Central Limit Theorem.",
      },
      {
        value: "large",
        label: "Large Dataset (300-10,000 records)",
        description: "Substantial data allowing for robust statistical analysis",
        example:
          "Annual customer database with 5,000 records, Website analytics with 2,000 daily visitors, Manufacturing quality data with 1,500 measurements",
        icon: "📈",
        detailedExplanation:
          "Large samples provide high statistical power to detect even small effects. Most statistical assumptions are less critical, and you can use more sophisticated analytical techniques.",
      },
      {
        value: "very-large",
        label: "Very Large Dataset (10,000+ records)",
        description: "Big data requiring specialized approaches and considerations",
        example:
          "E-commerce transaction database with 50,000+ records, Social media analytics, IoT sensor data, National survey data",
        icon: "🗄️",
        detailedExplanation:
          "Very large samples can detect tiny effects that may not be practically significant. Focus shifts to effect sizes and practical significance rather than statistical significance.",
      },
    ],
  },
  {
    id: "columnCount",
    question: "How many variables are you analyzing together?",
    subtitle: "The number of variables determines the complexity of your analysis",
    icon: "📋",
    type: "single",
    helpText:
      "The number of variables you're analyzing simultaneously affects which statistical methods are appropriate. Simple analyses look at one or two variables, while complex analyses examine multiple variables and their interactions.",
    options: [
      {
        value: "one",
        label: "Single Variable Analysis",
        description: "Examining one variable in isolation to understand its characteristics",
        example:
          "Analyzing only customer ages to understand age distribution, Looking at sales amounts to find average revenue, Examining test scores to identify performance patterns",
        icon: "1️⃣",
        detailedExplanation:
          "Single variable analysis focuses on descriptive statistics like mean, median, standard deviation, and distribution shape. Perfect for understanding data quality and basic patterns.",
      },
      {
        value: "two",
        label: "Two Variable Analysis (Bivariate)",
        description: "Comparing or finding relationships between exactly two variables",
        example:
          "Comparing sales performance between two regions, Analyzing relationship between study hours and test scores, Examining correlation between age and income",
        icon: "2️⃣",
        detailedExplanation:
          "Bivariate analysis examines relationships, correlations, and comparisons between two variables. This includes t-tests, correlation analysis, and simple regression.",
      },
      {
        value: "multiple",
        label: "Multiple Variable Analysis (Multivariate)",
        description: "Analyzing three or more variables simultaneously to understand complex relationships",
        example:
          "Predicting house prices using size, location, age, and condition, Analyzing customer satisfaction based on price, quality, service, and delivery time, Comparing sales across 5 regions while controlling for seasonality",
        icon: "3️⃣",
        detailedExplanation:
          "Multivariate analysis examines complex relationships between multiple variables. This includes multiple regression, ANOVA with multiple factors, and advanced modeling techniques.",
      },
    ],
  },
  {
    id: "hasGroups",
    question: "Does your data naturally divide into distinct groups or categories?",
    subtitle: "Understanding your data structure helps determine the right analytical approach",
    icon: "👥",
    type: "single",
    helpText:
      "This question helps us understand whether you're working with categorical groupings (like comparing different departments) or continuous measurements (like height or weight). This fundamentally affects which statistical tests are appropriate.",
    options: [
      {
        value: "yes",
        label: "Yes, I have distinct groups to compare",
        description: "My data can be divided into clear, separate categories or groups",
        example:
          "Comparing performance between Male vs Female employees, Analyzing satisfaction across different age groups (18-25, 26-35, 36-50, 50+), Comparing sales between Product Categories (Electronics, Clothing, Books), Examining differences between Treatment vs Control groups",
        icon: "👥",
        detailedExplanation:
          "Group-based analysis allows for comparisons between categories using tests like t-tests, ANOVA, or chi-square tests. Each group should have sufficient sample size for reliable results.",
      },
      {
        value: "no",
        label: "No, I have continuous measurements without clear groups",
        description: "My data consists of measurements or values on a continuous scale",
        example:
          "Heights ranging from 5.1 to 6.8 feet, Temperatures from 65°F to 95°F, Prices from $10.50 to $299.99, Ages from 18 to 75 years, Income from $25,000 to $150,000",
        icon: "📏",
        detailedExplanation:
          "Continuous data analysis focuses on relationships, correlations, and regression analysis. You can create groups from continuous data if needed, but the natural analysis examines relationships along the continuous scale.",
      },
      {
        value: "both",
        label: "I have both groups and continuous measurements",
        description: "My dataset contains both categorical groups and continuous variables",
        example:
          "Analyzing salary (continuous) differences between departments (groups), Examining test scores (continuous) across different schools (groups), Comparing sales revenue (continuous) between regions (groups) over time (continuous)",
        icon: "🔄",
        detailedExplanation:
          "Mixed data types allow for the most comprehensive analysis, including group comparisons, correlations within groups, and complex modeling that considers both categorical and continuous factors.",
      },
    ],
  },
  {
    id: "goal",
    question: "What is your primary research question or analysis goal?",
    subtitle: "Your objective determines which statistical approach will be most valuable",
    icon: "🎯",
    type: "single",
    helpText:
      "This is the most important question! Your analysis goal determines everything else - which tests to use, how to interpret results, and what conclusions you can draw. Be specific about what you want to discover or prove.",
    options: [
      {
        value: "compare",
        label: "Compare Groups or Categories",
        description: "Determine if different groups perform differently or have different characteristics",
        example:
          "Are sales higher in Region A vs Region B? Do men and women rate our product differently? Is there a difference in test scores between teaching methods? Which marketing campaign performed better?",
        icon: "⚖️",
        detailedExplanation:
          "Group comparison analysis uses tests like t-tests, ANOVA, or chi-square tests to determine if observed differences between groups are statistically significant or just due to random variation.",
      },
      {
        value: "relationship",
        label: "Find Relationships & Correlations",
        description: "Discover how variables are connected and influence each other",
        example:
          "Does more study time lead to better grades? Is there a relationship between employee satisfaction and productivity? How does advertising spend relate to sales revenue? Are customer age and purchase amount correlated?",
        icon: "🔗",
        detailedExplanation:
          "Relationship analysis uses correlation analysis and regression to quantify how variables move together. This helps identify which factors influence outcomes and by how much.",
      },
      {
        value: "predict",
        label: "Predict or Forecast Future Values",
        description: "Use existing data patterns to estimate future outcomes or unknown values",
        example:
          "Predict next quarter's sales based on historical data, Estimate house prices based on size and location, Forecast customer demand for inventory planning, Predict student success based on entrance exam scores",
        icon: "🔮",
        detailedExplanation:
          "Predictive analysis uses regression models, time series analysis, or machine learning to create models that can estimate future values based on historical patterns and relationships.",
      },
      {
        value: "classify",
        label: "Classify or Categorize Data",
        description: "Automatically sort data into different categories or identify patterns",
        example:
          "Classify emails as spam or not spam, Predict whether customers will purchase or not, Categorize customer feedback as positive, negative, or neutral, Identify high-risk vs low-risk loan applications",
        icon: "🗂️",
        detailedExplanation:
          "Classification analysis uses logistic regression, decision trees, or other machine learning techniques to predict categorical outcomes based on input variables.",
      },
      {
        value: "explore",
        label: "Explore and Understand Data Patterns",
        description: "Get a comprehensive understanding of your data without specific hypotheses",
        example:
          "What patterns exist in my customer data? Are there any interesting trends or anomalies? What does the overall distribution of my data look like? What are the key characteristics of my dataset?",
        icon: "🔍",
        detailedExplanation:
          "Exploratory analysis uses descriptive statistics, visualizations, and data mining techniques to uncover patterns, identify outliers, and understand the overall structure of your data.",
      },
      {
        value: "test-hypothesis",
        label: "Test a Specific Hypothesis",
        description: "Validate or refute a specific claim or theory about your data",
        example:
          "Test if a new drug is more effective than the current treatment, Verify if a new teaching method improves learning outcomes, Confirm whether a process change reduces defect rates, Validate if a marketing strategy increases conversion rates",
        icon: "🧪",
        detailedExplanation:
          "Hypothesis testing uses formal statistical tests to determine whether your data provides sufficient evidence to support or reject a specific claim, with controlled error rates.",
      },
    ],
  },
  {
    id: "testRelationships",
    question: "Do you need formal statistical testing or just descriptive insights?",
    subtitle: "This determines whether we focus on statistical significance or descriptive analysis",
    icon: "🧪",
    type: "single",
    helpText:
      "Statistical significance testing tells you if patterns in your data are likely real or just due to chance. Descriptive analysis focuses on understanding and visualizing patterns without formal testing. Choose based on whether you need to make confident decisions or just explore your data.",
    options: [
      {
        value: "yes",
        label: "Yes, I need statistical significance testing",
        description:
          "I want to know if relationships and differences are statistically significant, not just coincidental",
        example:
          "Is the difference in sales performance statistically significant or could it be random chance? Can I confidently say this treatment works better? Is this correlation strong enough to base decisions on?",
        icon: "✅",
        detailedExplanation:
          "Statistical testing provides p-values and confidence intervals to help you make confident decisions. This is essential for research, business decisions, and any situation where you need to distinguish real effects from random variation.",
      },
      {
        value: "no",
        label: "No, I just want to understand and visualize patterns",
        description: "I want descriptive insights, charts, and summaries without formal hypothesis testing",
        example:
          "Show me what my data looks like, Create visualizations to understand trends, Provide summary statistics and distributions, Help me explore patterns without formal testing",
        icon: "📈",
        detailedExplanation:
          "Descriptive analysis focuses on understanding your data through visualizations, summary statistics, and pattern identification. This is perfect for initial data exploration and reporting.",
      },
      {
        value: "both",
        label: "I want both descriptive insights and statistical testing",
        description: "I need comprehensive analysis including both exploration and formal testing",
        example:
          "First help me understand my data, then test specific hypotheses, Provide visualizations and statistical validation, Give me both exploratory insights and confirmatory testing",
        icon: "🔬",
        detailedExplanation:
          "Comprehensive analysis combines exploratory data analysis with confirmatory statistical testing. This provides the most complete understanding of your data and supports both discovery and decision-making.",
      },
      {
        value: "unsure",
        label: "I'm not sure what I need",
        description: "Help me decide what type of analysis would be most appropriate for my situation",
        example:
          "I'm new to data analysis and need guidance, I'm not sure if my question requires statistical testing, Help me understand what approach would be best for my goals",
        icon: "❓",
        detailedExplanation:
          "We'll guide you through the decision process based on your data and goals. Generally, if you need to make important decisions or prove something works, you'll want statistical testing. If you're exploring or reporting, descriptive analysis may be sufficient.",
      },
    ],
  },
  {
    id: "groupsPaired",
    question: "If comparing groups, are you measuring the same subjects multiple times or different subjects?",
    subtitle: "This affects which statistical tests are valid for your data structure",
    icon: "🔄",
    type: "single",
    helpText:
      "This is crucial for selecting the right statistical test. Paired data comes from the same subjects measured under different conditions (like before/after studies). Independent data comes from different subjects in each group. The wrong choice can lead to incorrect conclusions.",
    options: [
      {
        value: "paired",
        label: "Paired/Related Groups (Same subjects measured multiple times)",
        description: "Comparing the same people, items, or subjects under different conditions or time points",
        example:
          "Student test scores before and after tutoring (same students), Blood pressure measurements before and after medication (same patients), Website conversion rates before and after redesign (same website), Employee productivity before and after training (same employees)",
        icon: "🔄",
        detailedExplanation:
          "Paired analysis accounts for individual differences and typically has more statistical power. Each subject serves as their own control, reducing variability and making it easier to detect real effects.",
      },
      {
        value: "independent",
        label: "Independent Groups (Different subjects in each group)",
        description: "Comparing separate, unrelated groups or samples with no overlap",
        example:
          "Comparing men vs women (different people), Sales performance between different cities (different locations), Test scores between different schools (different students), Customer satisfaction between different product lines (different customers)",
        icon: "↔️",
        detailedExplanation:
          "Independent group analysis compares separate samples. This requires larger sample sizes to detect effects and must account for between-group variability. Random assignment helps ensure valid comparisons.",
      },
      {
        value: "mixed",
        label: "Mixed Design (Some paired, some independent factors)",
        description: "Complex design with both repeated measures and between-group factors",
        example:
          "Comparing treatment effectiveness (independent groups) measured at multiple time points (paired measurements), Testing different teaching methods (independent) on the same students across multiple subjects (paired)",
        icon: "🔀",
        detailedExplanation:
          "Mixed designs combine the benefits of both approaches but require more complex statistical analysis. They're powerful but need careful planning and interpretation.",
      },
      {
        value: "unsure",
        label: "I'm not sure about my data structure",
        description: "Help me understand whether my groups are related or independent",
        example:
          "I need help determining if my data is paired or independent, I'm not sure how my groups are structured, Help me understand the relationship between my measurements",
        icon: "🤔",
        detailedExplanation:
          "We'll help you identify your data structure by asking about how your data was collected and whether the same subjects appear in multiple groups or conditions.",
      },
    ],
  },
  {
    id: "dataSource",
    question: "How was your data collected?",
    subtitle: "Data collection method affects which analyses are appropriate and how to interpret results",
    icon: "📋",
    type: "single",
    helpText:
      "Understanding how your data was collected helps us recommend appropriate analyses and identify potential limitations. Different collection methods have different strengths and require different analytical approaches.",
    options: [
      {
        value: "experiment",
        label: "Controlled Experiment",
        description: "Data from a designed experiment with controlled conditions and random assignment",
        example:
          "A/B testing of website designs, Clinical trial comparing treatments, Laboratory experiment testing different conditions, Randomized controlled trial of teaching methods",
        icon: "🧪",
        detailedExplanation:
          "Experimental data allows for causal conclusions because variables are controlled and subjects are randomly assigned. This is the gold standard for determining cause-and-effect relationships.",
      },
      {
        value: "survey",
        label: "Survey or Questionnaire",
        description: "Data collected through surveys, questionnaires, or interviews",
        example:
          "Customer satisfaction survey, Employee engagement questionnaire, Market research survey, Academic research questionnaire, Online poll or feedback form",
        icon: "📝",
        detailedExplanation:
          "Survey data is great for understanding opinions, preferences, and self-reported behaviors. However, it may have response bias and can't establish causation, only associations.",
      },
      {
        value: "observational",
        label: "Observational Study",
        description: "Data collected by observing existing conditions without manipulation",
        example:
          "Sales data from business operations, Medical records analysis, Social media analytics, Website usage statistics, Historical performance data",
        icon: "👁️",
        detailedExplanation:
          "Observational data reflects real-world conditions but can't prove causation due to potential confounding variables. It's valuable for understanding associations and patterns.",
      },
      {
        value: "secondary",
        label: "Secondary Data (Existing datasets)",
        description: "Data originally collected by others for different purposes",
        example:
          "Government census data, Industry reports, Academic datasets, Public databases, Previously collected company data",
        icon: "📚",
        detailedExplanation:
          "Secondary data is cost-effective and often large-scale, but you have no control over collection methods. Understanding the original purpose and limitations is crucial.",
      },
    ],
  },
  {
    id: "analysisExperience",
    question: "What's your experience level with statistical analysis?",
    subtitle: "This helps us tailor our recommendations and explanations to your background",
    icon: "🎓",
    type: "single",
    helpText:
      "Understanding your experience level helps us provide appropriate recommendations and explanations. We'll adjust the complexity of our suggestions and provide more or less detailed guidance based on your background.",
    options: [
      {
        value: "beginner",
        label: "Beginner (New to statistical analysis)",
        description: "I'm just starting to learn about data analysis and statistics",
        example:
          "I've never done statistical analysis before, I know basic Excel but not statistical tests, I'm learning about data analysis for the first time, I need step-by-step guidance",
        icon: "🌱",
        detailedExplanation:
          "We'll focus on simple, interpretable methods with clear explanations. We'll recommend basic tests and provide detailed guidance on interpretation and assumptions.",
      },
      {
        value: "intermediate",
        label: "Intermediate (Some experience with basic statistics)",
        description: "I understand basic concepts like averages, correlations, and simple tests",
        example:
          "I've done some basic analysis in Excel or similar tools, I understand concepts like mean, median, and correlation, I've heard of t-tests and regression but need guidance, I can interpret basic statistical output",
        icon: "📊",
        detailedExplanation:
          "We'll recommend standard statistical tests with moderate complexity. We'll provide interpretation guidance but assume you understand basic statistical concepts.",
      },
      {
        value: "advanced",
        label: "Advanced (Experienced with statistical methods)",
        description: "I'm comfortable with various statistical tests and their assumptions",
        example:
          "I regularly use statistical software like R, SPSS, or Python, I understand concepts like p-values, confidence intervals, and effect sizes, I'm familiar with regression, ANOVA, and other advanced methods, I can interpret complex statistical output",
        icon: "🎯",
        detailedExplanation:
          "We'll recommend sophisticated methods and assume you can handle complex analyses. We'll focus on method selection and provide technical details about assumptions and limitations.",
      },
    ],
  },
]

export const scenarioExamples: ScenarioExample[] = [
  {
    id: "customer-satisfaction",
    title: "Customer Satisfaction Analysis",
    description:
      "A retail company surveyed 500 customers about their satisfaction levels across different product categories and wants to understand what drives satisfaction.",
    icon: "😊",
    recommendedTest: "Multiple Regression Analysis",
    difficulty: "Intermediate",
    industry: "Retail/E-commerce",
    dataDescription:
      "Survey responses including satisfaction ratings (1-5 scale), product category, purchase amount, customer demographics, and service ratings",
    expectedOutcome: "Identify which factors most strongly predict customer satisfaction and quantify their impact",
  },
  {
    id: "ab-testing",
    title: "Website A/B Testing",
    description:
      "An e-commerce site tested two different checkout page designs to see which one leads to higher conversion rates.",
    icon: "🔄",
    recommendedTest: "Two-Sample t-test or Chi-square Test",
    difficulty: "Beginner",
    industry: "Digital Marketing",
    dataDescription:
      "Visitor data showing which page version they saw (A or B) and whether they completed the purchase (Yes/No)",
    expectedOutcome: "Determine if one page design significantly outperforms the other in conversion rate",
  },
  {
    id: "employee-training",
    title: "Training Program Effectiveness",
    description: "HR department wants to evaluate if a new training program improves employee performance scores.",
    icon: "📈",
    recommendedTest: "Paired t-test",
    difficulty: "Beginner",
    industry: "Human Resources",
    dataDescription:
      "Employee performance scores measured before and after the training program for the same group of employees",
    expectedOutcome: "Determine if the training program significantly improves performance scores",
  },
  {
    id: "sales-forecasting",
    title: "Sales Forecasting Model",
    description:
      "A company wants to predict monthly sales based on advertising spend, seasonality, and economic indicators.",
    icon: "📊",
    recommendedTest: "Multiple Regression with Time Series Components",
    difficulty: "Advanced",
    industry: "Sales & Marketing",
    dataDescription:
      "Monthly sales data, advertising expenditure, seasonal indicators, economic indices, and promotional activities over 3 years",
    expectedOutcome: "Create a predictive model to forecast future sales and identify key drivers",
  },
  {
    id: "quality-control",
    title: "Manufacturing Quality Control",
    description:
      "A manufacturer wants to compare defect rates across different production lines and shifts to identify quality issues.",
    icon: "⚙️",
    recommendedTest: "ANOVA and Chi-square Test",
    difficulty: "Intermediate",
    industry: "Manufacturing",
    dataDescription:
      "Production data including defect counts, production line, shift time, operator, and total units produced",
    expectedOutcome: "Identify which production lines or shifts have significantly different defect rates",
  },
  {
    id: "medical-research",
    title: "Clinical Trial Analysis",
    description: "Researchers want to test if a new medication is more effective than the current standard treatment.",
    icon: "💊",
    recommendedTest: "Independent t-test or Mann-Whitney U test",
    difficulty: "Intermediate",
    industry: "Healthcare/Research",
    dataDescription:
      "Patient outcomes measured on a continuous scale, with patients randomly assigned to either new treatment or control group",
    expectedOutcome: "Determine if the new treatment shows statistically significant improvement over the control",
  },
  {
    id: "market-segmentation",
    title: "Customer Market Segmentation",
    description:
      "A company wants to identify distinct customer segments based on purchasing behavior and demographics.",
    icon: "👥",
    recommendedTest: "Cluster Analysis (K-means)",
    difficulty: "Advanced",
    industry: "Marketing Analytics",
    dataDescription:
      "Customer data including purchase frequency, average order value, product categories, demographics, and engagement metrics",
    expectedOutcome: "Identify distinct customer segments and their characteristics for targeted marketing",
  },
  {
    id: "price-optimization",
    title: "Product Pricing Analysis",
    description:
      "An online retailer wants to understand how price changes affect demand and find the optimal pricing strategy.",
    icon: "💰",
    recommendedTest: "Regression Analysis with Price Elasticity",
    difficulty: "Advanced",
    industry: "E-commerce/Retail",
    dataDescription:
      "Historical data on product prices, sales volumes, competitor prices, seasonality, and promotional activities",
    expectedOutcome: "Determine price elasticity and identify optimal pricing points for maximum revenue",
  },
]

export function getTestRecommendations(answers: UserAnswers): TestRecommendation[] {
  const recommendations: TestRecommendation[] = []

  const { dataType, columnCount, hasGroups, goal, testRelationships, groupsPaired, sampleSize, analysisExperience } =
    answers

  // Enhanced recommendation logic based on all factors

  // Chi-square test for categorical data
  if (dataType.includes("categorical") && hasGroups === "yes" && testRelationships === "yes") {
    recommendations.push({
      name: "Chi-square Test of Independence",
      description:
        "Tests whether two categorical variables are independent of each other. Perfect for analyzing relationships between categorical variables like survey responses.",
      realWorldExample:
        "Testing if customer satisfaction (High/Medium/Low) is related to product category (Electronics/Clothing/Books). For example, are Premium customers more satisfied than Basic customers?",
      whenToUse:
        "Use when you have two categorical variables and want to test if they are related or independent of each other.",
      interpretation:
        "A significant result (p < 0.05) means the variables are related - they influence each other. A non-significant result means they are independent. Look at the effect size (Cramér's V) to understand the strength of the relationship.",
      assumptions: [
        "Data should be in frequency counts, not percentages",
        "Expected frequency in each cell should be at least 5",
        "Observations should be independent",
        "Variables should be categorical",
      ],
      stepByStep: [
        "1. Create a contingency table with your categorical variables",
        "2. Calculate expected frequencies for each cell",
        "3. Compute the chi-square statistic",
        "4. Compare to critical value or use p-value",
        "5. Interpret the result and calculate effect size if significant",
      ],
      link: "/app/analysis?test=chi-square",
      confidence: 0.9,
      icon: "🎲",
      difficulty: analysisExperience === "beginner" ? "Beginner" : "Intermediate",
    })
  }

  // T-tests for numeric data with groups
  if (dataType.includes("numeric") && goal === "compare" && hasGroups === "yes") {
    if (groupsPaired === "paired") {
      recommendations.push({
        name: "Paired t-test",
        description:
          "Compares the average of the same group measured at two different times or under two different conditions. Accounts for individual differences between subjects.",
        realWorldExample:
          "Comparing employee productivity scores before and after a training program, or testing blood pressure before and after medication for the same patients.",
        whenToUse:
          "Use when you have the same people/items measured twice (before/after, treatment/control on same subjects). Each subject serves as their own control.",
        interpretation:
          "A significant result means there's a real difference between the two measurements. The effect size (Cohen's d) tells you how big the difference is. Confidence intervals show the range of the true difference.",
        assumptions: [
          "Differences between paired observations should be normally distributed",
          "Pairs should be independent of each other",
          "Data should be measured at interval or ratio level",
          "No extreme outliers in the differences",
        ],
        stepByStep: [
          "1. Calculate the difference for each pair (After - Before)",
          "2. Check if differences are normally distributed",
          "3. Calculate the mean difference and standard error",
          "4. Compute t-statistic and degrees of freedom (n-1)",
          "5. Compare to critical value or use p-value to interpret",
        ],
        link: "/app/analysis?test=paired-t",
        confidence: 0.95,
        icon: "🔄",
        difficulty: "Beginner",
      })
    } else if (groupsPaired === "independent" && columnCount === "two") {
      const difficulty = sampleSize === "small" ? "Intermediate" : "Beginner"
      recommendations.push({
        name: "Independent t-test",
        description:
          "Compares the average values between two separate, unrelated groups to see if they are significantly different. Assumes groups are independent.",
        realWorldExample:
          "Comparing average salaries between male and female employees, or testing if customers from different regions spend different amounts on average.",
        whenToUse:
          "Use when comparing two separate groups of people or items that are not related to each other. Groups should be randomly sampled.",
        interpretation:
          "A significant result means the two groups have genuinely different averages. Look at the confidence interval to see the range of the difference. Effect size (Cohen's d) indicates practical significance.",
        assumptions: [
          "Data in each group should be normally distributed",
          "Groups should have similar variances (homogeneity of variance)",
          "Observations should be independent within and between groups",
          "Data should be measured at interval or ratio level",
        ],
        stepByStep: [
          "1. Check assumptions (normality and equal variances)",
          "2. Calculate means and standard deviations for each group",
          "3. Compute pooled standard error",
          "4. Calculate t-statistic and degrees of freedom",
          "5. Interpret p-value and confidence interval",
        ],
        link: "/app/analysis?test=independent-t",
        confidence: 0.9,
        icon: "↔️",
        difficulty: difficulty,
      })
    }
  }

  // ANOVA for multiple groups
  if (dataType.includes("numeric") && goal === "compare" && columnCount === "multiple" && hasGroups === "yes") {
    recommendations.push({
      name: "One-way ANOVA (Analysis of Variance)",
      description:
        "Compares average values across three or more independent groups simultaneously to find if any group is significantly different from the others.",
      realWorldExample:
        "Comparing customer satisfaction scores across 5 different product categories, or testing if sales performance varies across different sales regions.",
      whenToUse:
        "Use when comparing averages of three or more independent groups at the same time. More powerful than multiple t-tests and controls for Type I error.",
      interpretation:
        "A significant F-statistic means at least one group is different from the others, but doesn't tell you which ones. Follow up with post-hoc tests (like Tukey's HSD) to find which specific groups differ.",
      assumptions: [
        "Data in each group should be normally distributed",
        "Groups should have similar variances (homogeneity of variance)",
        "Observations should be independent within and between groups",
        "Data should be measured at interval or ratio level",
      ],
      stepByStep: [
        "1. Check assumptions (normality and equal variances)",
        "2. Calculate group means and overall mean",
        "3. Compute between-group and within-group variance",
        "4. Calculate F-statistic (between-group variance / within-group variance)",
        "5. If significant, conduct post-hoc tests to identify specific differences",
      ],
      link: "/app/analysis?test=anova",
      confidence: 0.85,
      icon: "⚖️",
      difficulty: "Intermediate",
    })
  }

  // Correlation and regression
  if (dataType.includes("numeric") && goal === "relationship") {
    recommendations.push({
      name: "Pearson Correlation Analysis",
      description:
        "Measures how strongly two numeric variables are related and in what direction (positive or negative). Quantifies linear relationships.",
      realWorldExample:
        "Finding the relationship between hours of study and exam scores, or between advertising spend and sales revenue. Helps identify which variables move together.",
      whenToUse:
        "Use when you want to understand if two numeric variables move together (as one increases, does the other increase or decrease?). Perfect for initial relationship exploration.",
      interpretation:
        "Values range from -1 to +1. Closer to ±1 means stronger relationship. Positive values mean both increase together, negative means one increases as the other decreases. Values near 0 indicate no linear relationship.",
      assumptions: [
        "Both variables should be normally distributed",
        "Relationship should be linear",
        "Data should be measured at interval or ratio level",
        "No extreme outliers that could distort the relationship",
      ],
      stepByStep: [
        "1. Create a scatter plot to visualize the relationship",
        "2. Check for linearity and outliers",
        "3. Calculate the correlation coefficient (r)",
        "4. Test for statistical significance",
        "5. Interpret the strength and direction of the relationship",
      ],
      link: "/app/analysis?test=correlation",
      confidence: 0.9,
      icon: "🔗",
      difficulty: "Beginner",
    })

    if (goal === "predict" || columnCount === "multiple") {
      const difficulty = columnCount === "multiple" ? "Intermediate" : "Beginner"
      recommendations.push({
        name: "Linear Regression Analysis",
        description:
          "Creates a mathematical model to predict one variable based on one or more other variables. Quantifies relationships and enables prediction.",
        realWorldExample:
          "Predicting house prices based on size and location, or forecasting sales based on advertising spend and seasonality. Helps understand which factors drive outcomes.",
        whenToUse:
          "Use when you want to predict a numeric outcome and understand which factors are most important for prediction. Can handle single or multiple predictor variables.",
        interpretation:
          "R-squared shows prediction accuracy (higher is better, max 1.0). Coefficients show how much the outcome changes for each predictor variable. P-values indicate which predictors are significant.",
        assumptions: [
          "Linear relationship between predictors and outcome",
          "Residuals should be normally distributed",
          "Constant variance of residuals (homoscedasticity)",
          "Independence of observations",
          "No perfect multicollinearity between predictors",
        ],
        stepByStep: [
          "1. Explore relationships with scatter plots",
          "2. Fit the regression model",
          "3. Check model assumptions with residual plots",
          "4. Evaluate model fit (R-squared, F-statistic)",
          "5. Interpret coefficients and make predictions",
        ],
        link: "/app/analysis?test=regression",
        confidence: 0.85,
        icon: "🔮",
        difficulty: difficulty,
      })
    }
  }

  // Time series analysis
  if (dataType.includes("time") || goal === "predict") {
    recommendations.push({
      name: "Time Series Analysis",
      description:
        "Analyzes data collected over time to identify trends, seasonal patterns, and make forecasts for future periods. Accounts for temporal dependencies.",
      realWorldExample:
        "Analyzing monthly website traffic to identify busy seasons and predict next quarter's visitors, or tracking daily sales to forecast inventory needs.",
      whenToUse:
        "Use when your data has dates/times and you want to understand patterns over time or predict future values. Essential for forecasting and trend analysis.",
      interpretation:
        "Look for upward/downward trends, repeating seasonal patterns, and cyclical behaviors. Forecast accuracy is measured by prediction errors. Confidence intervals show uncertainty in predictions.",
      assumptions: [
        "Data should be collected at regular time intervals",
        "Time series should be stationary (constant mean and variance) or made stationary",
        "Observations should be chronologically ordered",
        "Sufficient historical data for pattern identification",
      ],
      stepByStep: [
        "1. Plot the time series to identify patterns",
        "2. Decompose into trend, seasonal, and residual components",
        "3. Check for stationarity and transform if needed",
        "4. Select appropriate forecasting model",
        "5. Validate model and generate forecasts with confidence intervals",
      ],
      link: "/app/analysis?test=timeseries",
      confidence: 0.8,
      icon: "📅",
      difficulty: "Intermediate",
    })
  }

  // Classification for categorical outcomes
  if (goal === "classify" || (dataType.includes("categorical") && goal === "predict")) {
    recommendations.push({
      name: "Logistic Regression (Classification)",
      description:
        "Predicts which category or group something belongs to based on its characteristics. Models the probability of categorical outcomes.",
      realWorldExample:
        "Predicting whether an email is spam or not spam based on its content, or classifying customers as likely to buy or not buy based on their behavior.",
      whenToUse:
        "Use when you want to automatically sort things into categories or predict yes/no outcomes. Perfect for binary or categorical prediction problems.",
      interpretation:
        "Results show the probability of each category and which factors are most important for classification. Accuracy tells you how often predictions are correct. Odds ratios show the impact of each factor.",
      assumptions: [
        "Outcome variable should be categorical",
        "Observations should be independent",
        "Linear relationship between predictors and log-odds",
        "No perfect multicollinearity between predictors",
        "Large sample size for stable results",
      ],
      stepByStep: [
        "1. Prepare categorical outcome and predictor variables",
        "2. Fit the logistic regression model",
        "3. Evaluate model fit and significance",
        "4. Interpret coefficients as odds ratios",
        "5. Assess prediction accuracy and validate model",
      ],
      link: "/app/analysis?test=logistic",
      confidence: 0.8,
      icon: "🗂️",
      difficulty: "Advanced",
    })
  }

  // Default descriptive statistics
  if (recommendations.length === 0 || goal === "explore") {
    recommendations.push({
      name: "Descriptive Statistics & Data Exploration",
      description:
        "Provides comprehensive summary statistics, charts, and visualizations to help you understand your data's characteristics and patterns before formal testing.",
      realWorldExample:
        "Getting averages, ranges, and distribution charts of customer ages, or creating visualizations to understand sales patterns across different time periods.",
      whenToUse:
        "Use as a starting point for any data analysis, or when you want to explore and understand your data before doing specific tests. Essential first step in any analysis.",
      interpretation:
        "Look at averages (central tendency), spread (variability), and distribution shapes. Charts help identify outliers, patterns, and data quality issues. Use insights to guide further analysis.",
      assumptions: [
        "No specific statistical assumptions",
        "Data should be clean and properly formatted",
        "Variables should be correctly classified by type",
        "Sufficient data for meaningful patterns",
      ],
      stepByStep: [
        "1. Calculate basic statistics (mean, median, standard deviation)",
        "2. Create histograms and box plots for numeric variables",
        "3. Generate frequency tables for categorical variables",
        "4. Identify outliers and missing data patterns",
        "5. Create correlation matrices and scatter plots for relationships",
      ],
      link: "/app/analysis?test=descriptive",
      confidence: 1.0,
      icon: "🔍",
      difficulty: "Beginner",
    })
  }

  // Sort by confidence and return top recommendations
  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

export function generatePDFContent(answers: UserAnswers, recommendations: TestRecommendation[]) {
  const timestamp = new Date().toLocaleString()

  const dataTypeLabels = {
    numeric: "Numerical Data (Quantitative)",
    categorical: "Categorical Data (Qualitative)",
    ordinal: "Ordinal Data (Ranked Categories)",
    text: "Text & Written Content",
    time: "Time Series Data",
  }

  const goalLabels = {
    compare: "Compare Groups or Categories",
    relationship: "Find Relationships & Correlations",
    predict: "Predict or Forecast Future Values",
    classify: "Classify or Categorize Data",
    explore: "Explore and Understand Data Patterns",
    "test-hypothesis": "Test a Specific Hypothesis",
  }

  const sampleSizeLabels = {
    small: "Small Dataset (Less than 30 records)",
    medium: "Medium Dataset (30-300 records)",
    large: "Large Dataset (300-10,000 records)",
    "very-large": "Very Large Dataset (10,000+ records)",
  }

  return {
    title: "AnalyzeX — Your Personalized Statistical Test Guide",
    subtitle: "Comprehensive recommendations and analysis approaches for your dataset",
    timestamp,
    userProfile: {
      dataTypes: answers.dataType.map((type) => dataTypeLabels[type as keyof typeof dataTypeLabels]).join(", "),
      analysisGoal: goalLabels[answers.goal as keyof typeof goalLabels],
      sampleSize: sampleSizeLabels[answers.sampleSize as keyof typeof sampleSizeLabels] || "Not specified",
      complexity:
        answers.columnCount === "one"
          ? "Simple (Single Variable)"
          : answers.columnCount === "two"
            ? "Moderate (Two Variables)"
            : "Complex (Multiple Variables)",
      groupStructure:
        answers.groupsPaired === "paired"
          ? "Paired/Related Groups"
          : answers.groupsPaired === "independent"
            ? "Independent Groups"
            : "Mixed/Unknown Structure",
      dataSource: answers.dataSource || "Not specified",
      experienceLevel: answers.analysisExperience || "Not specified",
      testingNeeds:
        answers.testRelationships === "yes"
          ? "Statistical significance testing required"
          : answers.testRelationships === "no"
            ? "Descriptive analysis only"
            : "Both descriptive and statistical testing",
    },
    recommendations,
    nextSteps: [
      "Review each recommended test to understand which best fits your specific needs",
      "Start with the highest confidence recommendation for your first analysis",
      "Consider running descriptive statistics first to understand your data structure",
      "Verify that your data meets the assumptions for your chosen statistical test",
      "Use AnalyzeX's built-in tools to perform these tests on your dataset",
      "Interpret results within the context of your domain knowledge and research goals",
      "Consider consulting with a statistician for complex analyses or critical business decisions",
    ],
    disclaimer:
      "This report provides personalized guidance based on your detailed responses about your data and analysis goals. Statistical analysis should always consider your specific research context, data quality, and domain expertise. The recommendations include assumptions and step-by-step guidance to help ensure proper application. For critical business or research decisions, consider consulting with a qualified statistician to validate your approach and interpretation.",
  }
}
