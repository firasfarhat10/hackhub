// Données de démonstration utilisées par scripts/seed.js.
// Séparer les données du script : on peut enrichir le jeu de test sans toucher à la logique.

// [nom, niveau, compétences, bio, pseudo GitHub (facultatif)]
// Les 12 premiers sont les comptes historiques (aya, youssef, omar...) : ne pas changer leur ordre.
const MEMBERS = [
  ['Aya Ben Salah', 'advanced', ['react', 'javascript', 'ui/ux', 'figma'], "Front-end et design, j'aime rendre les interfaces simples.", 'aya-bensalah'],
  ['Youssef Trabelsi', 'intermediate', ['node.js', 'express', 'mongodb'], 'Back-end, API REST et bases de donnees.', 'youssef-trabelsi'],
  ['Omar Gharbi', 'advanced', ['python', 'machine learning', 'pytorch', 'nlp'], 'Passionne de NLP et de modeles de langage.', 'omar-gharbi'],
  ['Sarra Mejri', 'beginner', ['pitch', 'marketing', 'business model'], 'Je prepare les pitchs et la strategie produit.'],
  ['Mehdi Jaziri', 'intermediate', ['docker', 'devops', 'linux', 'ci/cd'], 'Deploiement, conteneurs et automatisation.', 'mehdi-jaziri'],
  ['Ines Hammami', 'advanced', ['data science', 'python', 'pandas', 'visualisation'], 'Analyse de donnees et tableaux de bord.'],
  ['Karim Bouaziz', 'beginner', ['html', 'css', 'javascript'], 'Je debute en developpement web.'],
  ['Nour Chaabane', 'intermediate', ['react native', 'flutter', 'mobile'], 'Applications mobiles multiplateformes.'],
  ['Rami Feki', 'advanced', ['cybersecurite', 'pentest', 'reseaux'], 'Securite des applications et des reseaux.', 'rami-feki'],
  ['Lina Karray', 'intermediate', ['llm', 'prompt engineering', 'python', 'langchain'], 'Agents IA et integration de LLM.'],
  ['Hedi Sassi', 'beginner', ['gestion de projet', 'agile', 'scrum'], "Organisation d'equipe et suivi des taches."],
  ['Mariem Zouari', 'advanced', ['node.js', 'graphql', 'typescript', 'mongodb'], 'Architecture back-end et performance.', 'mariem-zouari'],
  ['Salma Ayari', 'advanced', ['computer vision', 'opencv', 'pytorch', 'python'], "Vision par ordinateur et detection d'objets.", 'salma-ayari'],
  ['Aziz Mansouri', 'intermediate', ['java', 'spring boot', 'postgresql'], 'Applications Java robustes et bases relationnelles.'],
  ['Fatma Jelassi', 'beginner', ['ui/ux', 'figma', 'design thinking'], 'Je dessine des maquettes centrees sur les utilisateurs.'],
  ['Bilel Hamdi', 'advanced', ['kubernetes', 'aws', 'terraform', 'devops'], 'Infrastructure cloud et automatisation.', 'bilel-hamdi'],
  ['Rania Sfaxi', 'intermediate', ['vue.js', 'javascript', 'tailwind'], 'Interfaces web rapides et accessibles.'],
  ['Amine Dridi', 'intermediate', ['iot', 'arduino', 'c++', 'raspberry pi'], 'Objets connectes et electronique embarquee.'],
  ['Yasmine Belhadj', 'advanced', ['data engineering', 'sql', 'spark', 'airflow'], 'Pipelines de donnees et entrepots.', 'yasmine-belhadj'],
  ['Walid Kefi', 'intermediate', ['solidity', 'blockchain', 'web3'], 'Smart contracts et applications decentralisees.'],
  ['Emna Guesmi', 'beginner', ['python', 'pandas', 'statistiques'], 'Je decouvre la data science.'],
  ['Skander Bouzid', 'advanced', ['unity', 'c#', 'game design'], 'Jeux video et experiences interactives.', 'skander-bouzid'],
  ['Oumaima Rekik', 'intermediate', ['flutter', 'dart', 'firebase'], 'Apps mobiles avec backend Firebase.'],
  ['Khalil Ben Amor', 'advanced', ['rust', 'go', 'systemes distribues'], 'Systemes performants et concurrents.', 'khalil-benamor'],
  ['Asma Chebbi', 'intermediate', ['marketing digital', 'pitch', 'growth'], 'Acquisition, communication et pitch.'],
  ['Hamza Mejdoub', 'beginner', ['html', 'css', 'react'], 'Premier hackathon cette annee !'],
  ['Chaima Toumi', 'advanced', ['nlp', 'transformers', 'huggingface', 'python'], 'Modeles de langage et classification de textes.', 'chaima-toumi'],
  ['Seif Ouali', 'intermediate', ['cybersecurite', 'ctf', 'forensics'], 'Capture The Flag et analyse forensique.'],
  ['Nadia Jlassi', 'intermediate', ['product management', 'agile', 'ux research'], 'Je fais le lien entre utilisateurs et developpeurs.'],
  ['Achraf Haddad', 'advanced', ['mlops', 'docker', 'mlflow', 'python'], 'Mettre les modeles de ML en production.', 'achraf-haddad']
];

// Indices dans MEMBERS (0 = Aya, 1 = Youssef, ...)
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// startInDays : décalage par rapport à aujourd'hui (négatif = passé). durationHours : durée.
const EVENTS = [
  {
    key: 'campus', title: 'Hack the Campus 2026', startInDays: -120, durationHours: 36, capacity: 50, status: 'closed',
    location: 'Ecole Polytechnique de Sousse',
    description: '36 heures pour imaginer les services numeriques du campus de demain : orientation, restauration, vie associative.',
    participants: range(10, 29)
  },
  {
    key: 'winter', title: 'HackHub Winter Edition', startInDays: -60, durationHours: 24, capacity: 40, status: 'closed',
    location: 'Ecole Polytechnique de Sousse',
    description: 'Hackathon de 24h sur le theme des services numeriques pour le campus.',
    participants: range(0, 9)
  },
  {
    key: 'fintech', title: 'FinTech Challenge', startInDays: -25, durationHours: 24, capacity: 30, status: 'closed',
    location: 'Technopole de Sousse',
    description: 'Paiement mobile, detection de fraude et inclusion financiere : des defis proposes par des acteurs du secteur.',
    participants: [1, 2, 5, 11, 13, 18, 19, 23, 24, 28, 29, 3, 15, 26, 9]
  },
  {
    key: 'dataviz', title: 'Data Viz Night', startInDays: -8, durationHours: 6, capacity: 25, status: 'published',
    location: 'Novation City, Sousse',
    description: 'Une soiree pour transformer des donnees ouvertes tunisiennes en visualisations qui racontent une histoire.',
    participants: [5, 18, 20, 12, 0, 14, 26, 2, 28, 16]
  },
  {
    // En cours : a commencé il y a 3 heures
    key: 'mobile', title: 'Mobile Dev Day', startInDays: -0.125, durationHours: 12, capacity: 30, status: 'published',
    location: 'Ecole Polytechnique de Sousse',
    description: 'Une journee pour concevoir et publier une application mobile utile aux etudiants.',
    participants: [7, 22, 16, 0, 25, 14, 6, 1, 11, 21, 3, 13]
  },
  {
    key: 'ai4good', title: 'AI for Good Hackathon', startInDays: 25, durationHours: 48, capacity: 40, status: 'published',
    location: 'Ecole Polytechnique de Sousse',
    description: "48h pour construire une solution utile avec l'intelligence artificielle : sante, education, environnement.",
    participants: range(0, 8)
  },
  {
    // Complet : capacité atteinte
    key: 'startup', title: 'Startup Weekend Sousse', startInDays: 40, durationHours: 54, capacity: 12, status: 'published',
    location: 'Technopole de Sousse',
    description: "Du vendredi soir au dimanche : une idee, une equipe, un prototype et un pitch devant des investisseurs.",
    participants: [3, 24, 28, 10, 13, 17, 19, 21, 23, 27, 29, 15]
  },
  {
    key: 'web3', title: 'Web3 & Blockchain Bootcamp', startInDays: 60, durationHours: 8, capacity: 35, status: 'published',
    location: 'En ligne',
    description: 'Bootcamp intensif pour comprendre la blockchain et deployer son premier smart contract.',
    participants: [19, 23, 13, 27, 8]
  },
  {
    key: 'green', title: 'Green Tech Sprint', startInDays: 90, durationHours: 11, capacity: 30, status: 'published',
    location: 'Novation City, Sousse',
    description: 'Une journee pour prototyper des applications autour de la transition ecologique.',
    participants: [3, 4, 5]
  },
  {
    key: 'gamejam', title: 'Game Jam 48h', startInDays: 120, durationHours: 48, capacity: 40, status: 'published',
    location: 'Ecole Polytechnique de Sousse',
    description: 'Creer un jeu video complet en 48 heures autour d\'un theme revele au lancement.',
    participants: [21, 14, 6, 25]
  },
  {
    key: 'cyber', title: 'Cyber Night (brouillon)', startInDays: 150, durationHours: 12, capacity: 25, status: 'draft',
    location: 'Ecole Polytechnique de Sousse',
    description: 'Capture The Flag de nuit, en preparation.',
    participants: []
  }
];

// [événement, titre, description, heures après le début, tags]
const WORKSHOPS = [
  ['campus', 'Vision par ordinateur avec OpenCV', 'Detecter et suivre des objets dans une video en quelques lignes de Python.', 3, ['computer vision', 'opencv', 'python']],
  ['campus', 'Kubernetes pour debutants', 'Pods, deployments et services : deployer une API sur un cluster.', 6, ['kubernetes', 'devops', 'docker']],
  ['campus', 'Design thinking express', "Passer d'un probleme flou a une idee testable en une heure.", 1, ['design thinking', 'ui/ux', 'ideation']],
  ['winter', 'MongoDB pour les hackathons', 'Modeliser vite et bien avec Mongoose.', 2, ['mongodb', 'node.js']],
  ['winter', 'Git en equipe', 'Branches, pull requests et resolution de conflits sans stress.', 4, ['git', 'github', 'collaboration']],
  ['fintech', 'APIs bancaires et open banking', 'Consommer une API de paiement de test de maniere securisee.', 2, ['api', 'fintech', 'securite']],
  ['fintech', 'Smart contracts 101', 'Ecrire et tester un premier contrat Solidity.', 5, ['solidity', 'blockchain', 'web3']],
  ['fintech', 'Detection de fraude par ML', 'Classification desequilibree, metriques et explicabilite.', 8, ['machine learning', 'python', 'data science']],
  ['dataviz', 'Dashboards avec Python', 'Construire un tableau de bord interactif a partir d\'un CSV.', 1, ['python', 'visualisation', 'pandas']],
  ['dataviz', 'Raconter une histoire avec les donnees', 'Choisir le bon graphique et construire un message clair.', 3, ['data storytelling', 'visualisation', 'communication']],
  ['mobile', 'Flutter : de zero a la premiere app', 'Widgets, navigation et etat avec Flutter.', 1, ['flutter', 'dart', 'mobile']],
  ['mobile', 'Publier sur les stores', 'Signature, captures et fiche Play Store pour une premiere publication.', 4, ['mobile', 'deploiement', 'android']],
  ['mobile', 'React Native et Expo', 'Une app iOS et Android avec JavaScript.', 8, ['react native', 'javascript', 'mobile']],
  ['ai4good', 'Integrer un LLM dans une app web', 'Appeler une API de LLM, structurer les reponses en JSON et gerer les erreurs.', 2, ['llm', 'python', 'api']],
  ['ai4good', 'React en 90 minutes', 'Composants, hooks et appels API pour construire un front rapidement.', 5, ['react', 'javascript', 'front-end']],
  ['ai4good', 'RAG avec LangChain', 'Faire repondre un LLM a partir de vos propres documents.', 8, ['llm', 'langchain', 'rag', 'python']],
  ['ai4good', 'Deployer sans douleur', "Docker, variables d'environnement et mise en ligne sur Render et Vercel.", 25, ['docker', 'devops', 'deploiement']],
  ['ai4good', 'Pitcher son projet', 'Structurer un pitch de 3 minutes convaincant devant un jury.', 31, ['pitch', 'business', 'communication']],
  ['startup', 'Business model canvas', 'Clarifier la proposition de valeur et les sources de revenus.', 2, ['business model', 'strategie', 'pitch']],
  ['startup', 'Growth hacking', 'Trouver ses 100 premiers utilisateurs sans budget.', 20, ['growth', 'marketing digital', 'acquisition']],
  ['web3', 'Ethereum et Solidity', 'Comptes, transactions et deploiement sur un reseau de test.', 1, ['solidity', 'ethereum', 'web3']],
  ['web3', 'Securite des smart contracts', 'Reentrance, overflow et bonnes pratiques d\'audit.', 4, ['securite', 'audit', 'blockchain']],
  ['green', "IoT pour l'energie", 'Mesurer la consommation electrique avec un capteur et un Arduino.', 2, ['iot', 'arduino', 'energie']],
  ['gamejam', 'Unity : prototyper en 2h', 'Scene, physique et controles pour un premier prototype jouable.', 2, ['unity', 'c#', 'game design']],
  ['gamejam', 'Pixel art pour les nuls', 'Creer sprites et animations simples pour son jeu.', 6, ['pixel art', 'design', 'game design']]
];

// Avis par événement : le n-ième avis est écrit par le n-ième participant de l'événement.
// Les notes et thèmes sont variés pour que la synthèse IA ait quelque chose à résumer.
const REVIEWS = {
  winter: [
    [5, "Organisation au top, les mentors etaient disponibles toute la nuit. J'ai beaucoup appris."],
    [4, 'Tres bonne ambiance et sujets interessants, mais le wifi a coupe plusieurs fois.'],
    [2, 'Les horaires ont change sans prevenir et la communication etait confuse.'],
    [5, 'Les ateliers etaient excellents, surtout celui sur MongoDB. Bravo au club !'],
    [3, "Correct dans l'ensemble. Le repas du soir est arrive tres en retard."],
    [4, 'Jury bienveillant et retours utiles sur notre projet.'],
    [1, 'Salle trop petite, impossible de se concentrer, et personne pour nous aider.'],
    [4, 'Super experience, je reviendrai. Un peu plus de temps pour le pitch serait bien.']
  ],
  campus: [
    [5, 'Deux jours intenses, sujets varies et mentors tres pedagogues. Le meilleur hackathon du campus.'],
    [4, "L'atelier Kubernetes etait dense mais tres utile. Il manquait juste un peu de temps pour pratiquer."],
    [3, 'Bonne idee de theme, mais la salle etait bruyante et les prises electriques insuffisantes.'],
    [5, 'Ambiance incroyable, on a rencontre des gens de toutes les filieres. Merci aux organisateurs !'],
    [2, 'Le planning a ete modifie trois fois et personne ne nous a prevenus a temps.'],
    [4, 'Le jury a pose des questions pertinentes et nous a donne des conseils concrets pour la suite.'],
    [4, 'Repas corrects et cafe a volonte toute la nuit, ca aide a tenir 36 heures !'],
    [1, 'Notre equipe a ete laissee sans mentor pendant toute la premiere nuit. Tres decevant.'],
    [5, "L'atelier design thinking m'a fait changer completement notre idee de projet. Top."],
    [3, 'Experience correcte. Les sujets etaient interessants mais un peu trop vagues au depart.'],
    [4, "Organisation fluide a l'accueil, badges et kits prets. Le wifi a tenu toute la duree."],
    [2, 'Les resultats ont ete annonces avec deux heures de retard et sans explication des criteres.'],
    [5, "Premiere participation et je ne regrette rien. On a appris plus en 36h qu'en un semestre."],
    [4, "Bonne communication sur Discord pendant l'evenement, on avait les infos rapidement."]
  ],
  fintech: [
    [5, "Sujets concrets proposes par de vraies entreprises, c'etait motivant de travailler sur des cas reels."],
    [4, "Atelier detection de fraude excellent, les donnees fournies etaient propres et bien documentees."],
    [3, 'Interessant, mais le jury etait surtout attentif au business et tres peu a la technique.'],
    [2, "L'acces aux APIs de test a ete donne tres tard, on a perdu la moitie de la matinee."],
    [5, 'Mentors du secteur financier tres disponibles, ils ont repondu a toutes nos questions.'],
    [4, 'Bonne ambiance et lieu agreable. Le dejeuner etait copieux.'],
    [1, 'Reglement change en cours de route sur les donnees autorisees. Communication catastrophique.'],
    [4, "Smart contracts 101 bien explique, meme pour quelqu'un qui n'avait jamais touche a Solidity."],
    [3, "Evenement correct, mais 24h pour un sujet aussi complexe que la finance, c'etait court."],
    [5, 'Tres bien organise du debut a la fin, horaires respectes et jury bienveillant.']
  ],
  dataviz: [
    [5, 'Format court tres efficace, parfait pour un soir de semaine.'],
    [4, "L'atelier storytelling etait la vraie bonne surprise de la soiree."],
    [4, 'Jeux de donnees ouverts bien choisis, on pouvait vraiment raconter quelque chose.'],
    [3, 'Sympa, mais il faisait tres chaud dans la salle et il manquait des chaises.'],
    [2, "Pas assez de mentors pour le nombre d'equipes, on attendait longtemps pour avoir de l'aide."],
    [5, "Ambiance detendue, pizzas et bonne musique. J'ai adore."],
    [4, 'Bonne initiation a la visualisation, les slides sont partagees sur le Discord.'],
    [1, 'Le projecteur ne marchait pas pour les presentations finales, on a du pitcher sans support.']
  ]
};

module.exports = { MEMBERS, EVENTS, WORKSHOPS, REVIEWS };
