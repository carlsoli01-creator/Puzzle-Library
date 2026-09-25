/* Short original articles for the reading-comprehension trainer.
   In each question the first option is the correct one; the UI shuffles them. */
(function () {
  'use strict';

  GL.ARTICLES = [
    {
      id: 'octopus',
      title: 'The Mind in Eight Arms',
      topic: 'Biology',
      level: 'Easy',
      tone: 'moss',
      text: [
        'An octopus has roughly 500 million neurons, a count closer to that of a dog than of a snail. What makes the animal strange is not the number but the layout: about two-thirds of those neurons sit in its arms rather than in its central brain. Each arm can taste, touch and make simple decisions on its own, so an arm exploring a crevice can grab a crab before the brain has fully "decided" to eat it.',
        'The octopus is built differently in other ways too. It has three hearts, two of which pump blood through the gills while the third serves the rest of the body. Its blood is blue, because it carries oxygen with a copper-based molecule called hemocyanin rather than the iron-based hemoglobin that makes our blood red.',
        'Perhaps most puzzling is its camouflage. Octopuses change colour and texture in a fraction of a second, yet most species are thought to be colour-blind. Researchers are still testing ideas about how they match backgrounds they may not see in colour, including light-sensitive proteins in the skin itself.',
        'Their intelligence shows up in aquariums, where octopuses have learned to open jars, squirt water at lights they dislike and, in one famous 2016 case in New Zealand, slip out of a tank and down a drainpipe to the sea.',
      ],
      questions: [
        { q: 'Where are most of an octopus\'s neurons located?', opts: ['In its arms', 'In its central brain', 'In its three hearts', 'Spread evenly through its skin'], why: 'About two-thirds of the neurons sit in the arms.' },
        { q: 'Why is octopus blood blue?', opts: ['It uses copper-based hemocyanin to carry oxygen', 'It has no oxygen in it', 'It uses iron-based hemoglobin', 'It absorbs colour from seawater'], why: 'Hemocyanin contains copper, which gives a blue tint.' },
        { q: 'What does the article describe as "most puzzling"?', opts: ['That octopuses camouflage well despite likely colour-blindness', 'That octopuses have three hearts', 'That octopuses escape from tanks', 'That octopuses eat crabs'], why: 'The camouflage paradox is introduced as "perhaps most puzzling".' },
        { q: 'What can best be inferred about an octopus arm?', opts: ['It can act with some independence from the brain', 'It must wait for the brain before moving', 'It contains a second full-size brain', 'It cannot sense taste'], why: 'Arms can taste, touch and make simple decisions on their own.' },
      ],
    },
    {
      id: 'bees',
      title: 'How Honeybees Choose a Home',
      topic: 'Nature',
      level: 'Medium',
      tone: 'olive',
      text: [
        'In late spring a crowded honeybee colony may split. The old queen leaves with thousands of workers, and the swarm settles on a branch while it decides where to live. It has no leader for this choice. Instead, a few hundred experienced scout bees fly out to inspect hollow trees and other cavities.',
        'A scout that finds a promising site returns and performs a waggle dance on the surface of the swarm. The angle of the dance tells other bees the direction of the site, and the length of the waggle indicates distance. Crucially, scouts dance longer and more vigorously for better sites, so good options recruit more visitors, who may then dance for them in turn.',
        'Poorer options fade because each scout\'s enthusiasm declines with every return trip. Scouts backing one site also deliver "stop signals", small head-butts, to bees dancing for rivals. Once enough scouts, roughly fifteen or more, are present at a single site at the same time, they sense a quorum and begin producing a piping sound that warms up the swarm for flight.',
        'The biologist Thomas Seeley, who studied this process for decades, called it a honeybee democracy. In experiments, swarms usually chose the best cavity on offer, showing how a group of simple individuals can reach a smart decision without anyone being in charge.',
      ],
      questions: [
        { q: 'What does the angle of the waggle dance communicate?', opts: ['The direction of the site', 'The distance to the site', 'The quality of the site', 'The number of scouts needed'], why: 'Angle gives direction; the length of the waggle gives distance.' },
        { q: 'What triggers the swarm to prepare for flight?', opts: ['Enough scouts gathering at one site at once', 'The queen choosing a site', 'All scouts dancing for the same site', 'A fixed amount of time passing'], why: 'A quorum of about fifteen or more scouts at one site starts the piping.' },
        { q: 'Why do weaker sites lose support over time?', opts: ['Scouts\' enthusiasm for any site declines with each trip', 'The queen rejects them', 'Scouts forget their location', 'They are farther away'], why: 'Declining enthusiasm plus stop signals let poorer options fade.' },
        { q: 'What is the main idea of the article?', opts: ['A group without a leader can make a good collective decision', 'Honeybees are ruled by their queen', 'Scout bees are more intelligent than other bees', 'Swarms usually make poor choices'], why: 'The closing paragraph frames it as a democracy that picks well without anyone in charge.' },
      ],
    },
    {
      id: 'zero',
      title: 'The Long Road to Zero',
      topic: 'History of Maths',
      level: 'Medium',
      tone: 'stone',
      text: [
        'Zero feels obvious today, but it took humans thousands of years to treat "nothing" as a number. The Babylonians used a placeholder symbol to mark an empty position in their numbers, much as we use the 0 in 105 to show there are no tens. But they did not use it on its own or calculate with it.',
        'The decisive step came in India. In 628 CE the astronomer Brahmagupta wrote down rules for arithmetic with zero, such as that a number minus itself equals zero and that any number multiplied by zero is zero. He struggled with division by zero, a problem that still has no ordinary numerical answer.',
        'The Maya of Central America developed a zero independently, using a shell-shaped glyph in their calendars. It was the Indian system, however, that spread west through the Islamic world, where scholars such as al-Khwarizmi wrote about it. The Italian mathematician Fibonacci popularised these "Hindu-Arabic" numerals in Europe in his 1202 book Liber Abaci, showing merchants how much easier they made bookkeeping than Roman numerals.',
        'Resistance lingered for a time, partly because a zero could easily be altered into another digit on a written record. Eventually its convenience won, and zero became the quiet foundation of algebra, calculus and every digital computer.',
      ],
      questions: [
        { q: 'How did the Babylonians use their zero-like symbol?', opts: ['Only as a placeholder for an empty position', 'As a full number for calculation', 'For dividing by nothing', 'In their calendars only'], why: 'They used it to mark empty positions but not as a number on its own.' },
        { q: 'Who first wrote rules for calculating with zero, according to the article?', opts: ['Brahmagupta', 'Fibonacci', 'al-Khwarizmi', 'The Maya'], why: 'Brahmagupta set out rules in 628 CE.' },
        { q: 'Why did Fibonacci promote the new numerals?', opts: ['They made bookkeeping much easier than Roman numerals', 'They were required by the church', 'They removed the need for zero', 'They were harder to forge'], why: 'He showed merchants how much easier they made bookkeeping.' },
        { q: 'Which statement about the Maya is supported by the text?', opts: ['They invented a zero independently of India', 'They learned zero from Fibonacci', 'They spread zero to Europe', 'They had no concept of zero'], why: 'The article says they developed it independently.' },
      ],
    },
    {
      id: 'forgetting',
      title: 'The Curve of Forgetting',
      topic: 'Psychology',
      level: 'Easy',
      tone: 'taupe',
      text: [
        'In the 1880s the German psychologist Hermann Ebbinghaus ran one of the strangest experiments in science, with himself as the only subject. To study memory without the help of meaning, he invented thousands of nonsense syllables such as "DAX" and "BOK", memorised lists of them and then tested how much he retained after different delays.',
        'To measure memory precisely he used a "savings" method: he recorded how much less time it took to relearn a list compared with learning it the first time. The results, published in 1885, produced what we now call the forgetting curve. Memory drops steeply at first, with much of the loss happening within the first day, and then declines more slowly.',
        'Ebbinghaus also noticed the antidote. Material reviewed several times, with gaps between sessions, was retained far better than material crammed in one sitting. This spacing effect has since been confirmed in hundreds of studies and underlies modern flashcard apps that schedule reviews just as you are about to forget.',
        'The lesson for learners is practical: a short review the next day, then a few days later, then a week later, beats hours of rereading the night before a test.',
      ],
      questions: [
        { q: 'Why did Ebbinghaus use nonsense syllables?', opts: ['To study memory without the help of meaning', 'Because they were easier to pronounce', 'To test other volunteers', 'To create a new language'], why: 'He wanted to remove the effect of meaning.' },
        { q: 'What did the "savings" method measure?', opts: ['How much faster a list was relearned', 'How many syllables he invented', 'How long he could stay focused', 'How many lists he forgot entirely'], why: 'Savings = the reduction in time needed to relearn.' },
        { q: 'What shape does the forgetting curve take?', opts: ['A steep early drop followed by slower decline', 'A steady straight-line decline', 'Slow at first, then a sudden drop', 'Flat for a week, then a drop'], why: 'Memory drops steeply at first, then more slowly.' },
        { q: 'Which study plan does the article recommend?', opts: ['Short reviews spaced out over days and weeks', 'Rereading for hours the night before', 'Studying one subject only', 'Avoiding review until the test'], why: 'Spaced reviews beat cramming.' },
      ],
    },
    {
      id: 'tardigrade',
      title: 'The Toughest Animal on Earth',
      topic: 'Biology',
      level: 'Easy',
      tone: 'slate',
      text: [
        'Tardigrades, often called water bears, are plump eight-legged animals usually less than a millimetre long. They were first described in 1773 and live almost everywhere: in moss, in soil, on mountaintops and in the deep sea. Under a microscope they lumber along like tiny, clawed bears.',
        'Their fame comes from a survival trick called cryptobiosis. When their surroundings dry out, tardigrades pull in their legs, lose almost all of the water in their bodies and curl into a dried-up form known as a "tun". In this state their metabolism nearly stops, and they can survive extremes that would kill almost any other animal, including intense cold, high pressure and strong radiation.',
        'In 2007 scientists sent dried tardigrades into low Earth orbit on a satellite and exposed them to the vacuum of space. After returning, some of them revived and even produced healthy offspring.',
        'Tardigrades are not invincible: in their active, hydrated state they are fairly fragile, and they cannot survive forever as tuns. But their protective molecules are being studied for ideas about preserving vaccines and medicines without refrigeration.',
      ],
      questions: [
        { q: 'What is a "tun"?', opts: ['A dried-up, dormant form of a tardigrade', 'A tardigrade egg', 'The moss tardigrades live in', 'A type of radiation'], why: 'The tun is the dehydrated form entered during cryptobiosis.' },
        { q: 'What happened in the 2007 experiment?', opts: ['Some tardigrades survived space exposure and later reproduced', 'All tardigrades died in orbit', 'Tardigrades were found living on a satellite', 'Tardigrades grew larger in space'], why: 'Some revived and produced healthy offspring.' },
        { q: 'When are tardigrades most vulnerable?', opts: ['In their active, hydrated state', 'When frozen', 'When exposed to radiation as tuns', 'In the vacuum of space'], why: 'The article says they are fairly fragile when active.' },
        { q: 'What practical use is mentioned?', opts: ['Ideas for storing vaccines without refrigeration', 'Cleaning polluted water', 'Growing moss faster', 'Protecting astronauts from radiation'], why: 'Their protective molecules may help preserve vaccines and medicines.' },
      ],
    },
    {
      id: 'stink',
      title: 'The Great Stink',
      topic: 'History',
      level: 'Hard',
      tone: 'clay',
      text: [
        'In the hot summer of 1858 the River Thames smelled so bad that Londoners called it the Great Stink. For years the growing city had flushed raw sewage straight into the river, which was also a source of drinking water. The heat turned the problem into a crisis, and the smell reached Parliament itself, where curtains were soaked in chemicals in an attempt to block it.',
        'At the time most doctors believed that diseases such as cholera were spread by "miasma", or bad air. A physician named John Snow had argued otherwise. During an 1854 outbreak he mapped cholera deaths in Soho and traced them to a single contaminated water pump on Broad Street. His idea that cholera spread through water was not yet widely accepted.',
        'Ironically, it was the fear of foul air that finally moved Parliament to act. Within weeks it approved funding for a plan by the engineer Joseph Bazalgette. His team built intercepting sewers running parallel to the river, carrying waste east and away from the centre, along with more than a thousand miles of smaller street sewers. He deliberately made the pipes larger than needed, anticipating that the city would grow.',
        'The system largely ended cholera epidemics in London. It worked for the right reason, clean water, even though many of its supporters believed in the wrong one.',
      ],
      questions: [
        { q: 'What finally pushed Parliament to fund new sewers?', opts: ['The smell reaching Parliament during the hot summer', 'John Snow\'s cholera map', 'A cholera outbreak in Parliament', 'A request from Bazalgette'], why: 'Fear of foul air, as the stink reached Parliament, moved it to act.' },
        { q: 'What was the "miasma" theory?', opts: ['That disease spread through bad air', 'That disease spread through water', 'That the Thames was safe to drink', 'That sewers caused cholera'], why: 'Miasma = bad air.' },
        { q: 'Why did Bazalgette make the pipes larger than necessary?', opts: ['He expected the city to grow', 'Larger pipes were cheaper', 'To reduce the smell', 'Parliament required it'], why: 'He anticipated growth.' },
        { q: 'What is the irony described in the final paragraph?', opts: ['The sewers worked because of clean water, though many backers believed in bad air', 'The sewers made the smell worse', 'John Snow opposed the sewers', 'Cholera increased after the sewers were built'], why: 'It succeeded for the right reason while supporters believed the wrong one.' },
      ],
    },
    {
      id: 'taxi',
      title: 'Brains That Learned London',
      topic: 'Neuroscience',
      level: 'Medium',
      tone: 'ash',
      text: [
        'To drive a black cab in London, would-be drivers must pass an exam known as the Knowledge. They memorise roughly 25,000 streets and thousands of landmarks within six miles of Charing Cross, and must be able to describe the best route between any two points without a map. Preparing typically takes three to four years.',
        'In 2000 the neuroscientist Eleanor Maguire and colleagues scanned the brains of licensed taxi drivers. Compared with similar people who did not drive taxis, the drivers had a larger posterior hippocampus, a region involved in spatial memory and navigation. The longer someone had driven, the larger that region tended to be.',
        'A comparison alone cannot show cause and effect; perhaps people with bigger hippocampi are simply drawn to the job. So the team later followed trainees over time. Those who qualified showed growth in the posterior hippocampus over the training period, while those who failed or dropped out, and a control group, did not.',
        'The studies became a famous example of neuroplasticity, the brain\'s ability to change with experience. They also hinted at a trade-off: drivers did slightly worse than controls on some tests of new visual information, suggesting that the brain\'s resources are not unlimited.',
      ],
      questions: [
        { q: 'Which brain region was larger in taxi drivers?', opts: ['The posterior hippocampus', 'The frontal lobe', 'The visual cortex', 'The cerebellum'], why: 'The posterior hippocampus, linked to navigation.' },
        { q: 'Why did researchers follow trainees over time?', opts: ['To test whether training caused the brain change', 'To see who drove fastest', 'Because the first study was lost', 'To count how many streets they learned'], why: 'A one-time comparison cannot show cause and effect.' },
        { q: 'What trade-off does the article mention?', opts: ['Drivers did slightly worse on some tests of new visual information', 'Drivers forgot how to read maps', 'Drivers lost hearing', 'Drivers had smaller hippocampi overall'], why: 'Slightly weaker performance on some new visual information tasks.' },
        { q: 'What is neuroplasticity?', opts: ['The brain\'s ability to change with experience', 'A method of memorising maps', 'A brain-scanning technique', 'A type of taxi licence'], why: 'Defined directly in the final paragraph.' },
      ],
    },
    {
      id: 'voyager',
      title: 'A Message in a Golden Bottle',
      topic: 'Space',
      level: 'Hard',
      tone: 'rust',
      text: [
        'In 1977 NASA launched two spacecraft, Voyager 1 and Voyager 2, to study the outer planets. Each carries a gold-plated copper phonograph record intended as a message to any civilisation that might find it in the distant future. A committee chaired by the astronomer Carl Sagan chose its contents in less than a year.',
        'The Golden Record holds 115 images encoded as sound, greetings in 55 languages, natural sounds such as wind, thunder and birdsong, and about 90 minutes of music ranging from Bach and Beethoven to Peruvian panpipes, Javanese gamelan and Chuck Berry\'s "Johnny B. Goode".',
        'Because no one on another world would own a record player, the cover is engraved with instructions: diagrams showing how to play the disc and a map locating our Sun relative to fourteen pulsars, stars that flash with regular, identifiable rhythms. A tiny sample of uranium on the cover works as a clock, since its slow decay could reveal how long ago the craft was launched.',
        'Sagan admitted the chance of anyone finding the record was small. Voyager 1 entered interstellar space in 2012, yet it will not pass close to another star for tens of thousands of years. The record may say more about the people who sent it, and what they hoped to be, than about who might one day listen.',
      ],
      questions: [
        { q: 'What is the purpose of the pulsar map on the cover?', opts: ['To locate our Sun for anyone who finds it', 'To show the route of Voyager 2', 'To teach how to play the record', 'To mark planets the craft visited'], why: 'It locates the Sun relative to fourteen pulsars.' },
        { q: 'What does the uranium sample act as?', opts: ['A clock showing how long ago the craft launched', 'A power source', 'A protective coating', 'A radio beacon'], why: 'Its decay could reveal the elapsed time.' },
        { q: 'How are the images stored on the record?', opts: ['Encoded as sound', 'As printed photographs', 'Engraved on the cover', 'On a separate digital drive'], why: '115 images encoded as sound.' },
        { q: 'What is the author\'s view in the final paragraph?', opts: ['The record reveals a lot about its senders\' hopes', 'The record will surely be found soon', 'The project was a waste of money', 'Voyager 1 has already reached another star'], why: 'It may say more about the senders than about the listeners.' },
      ],
    },
  ];

  GL.ARTICLES.forEach((a) => { a.words = a.text.join(' ').split(/\s+/).length; });
})();
