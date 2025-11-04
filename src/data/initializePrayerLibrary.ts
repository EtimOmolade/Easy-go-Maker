// Prayer Library Initialization for localStorage
// This will be migrated to Supabase by Lovable

import { kingdomFocusPrayers } from './kingdomFocusPrayers';

// ============================================
// 1. JUNE 30 (Missing from parser - add manually)
// ============================================

const june30Prayer = {
  id: 'kf-june-30',
  month: 'June',
  day: 30,
  day_of_week: 'Monday',
  title: 'June 30 Intercessions',
  category: 'Kingdom Focused',
  intercession_points: [
    "Father, thank You for the holy invasion of great and abiding multitudes into our Service(s) yesterday, and for placing Your touch-not seal upon every worshipper by Your Word – Psa. 118:23",
    "Father, we destroy all satanic strongholds against the salvation of all that are ordained unto eternal life across our harvest field as we take the territories for Christ – Act. 13:48",
    "Father, continue to make this church a spiritually watered garden where every worshipper is well-nourished by Your Word – Isa. 58:11",
    "Father, open the eyes of all our first timers and new converts to see this church as their God-appointed city of refuge, so they can abide here for life – 2 Sam. 7:10"
  ],
  created_at: new Date().toISOString()
};

// ============================================
// 2. REAL PRAYERS (November 2 - December 31)
// ============================================

const novemberDecemberPrayers = [
  // November 2
  {
    id: 'kf-november-2',
    month: 'November',
    day: 2,
    day_of_week: 'Sunday',
    title: 'November 2 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for bringing us into the month of November with testimonies of Your goodness and mercies that have followed us all year long – Psa. 107:1",
      "Father, as we enter this season of thanksgiving, let every worshipper in this church experience uncommon harvest in every area of their lives – Psa. 126:5-6",
      "Lord Jesus, let this month mark the beginning of unprecedented spiritual breakthroughs for every member of this church – Isa. 43:18-19",
      "Father, grant us grace to finish the year strong, with all our set goals and divine assignments accomplished – Phil. 3:13-14"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 3
  {
    id: 'kf-november-3',
    month: 'November',
    day: 3,
    day_of_week: 'Monday',
    title: 'November 3 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree supernatural acceleration upon the growth and expansion of this church in this final quarter of the year – Isa. 60:22",
      "Father, let every seed sown by our members this year yield a hundredfold harvest before December 31st – Mark 4:20",
      "Lord Jesus, visit our services this week with fresh waves of Your glory that will draw multitudes into Your Kingdom – Hag. 2:7",
      "Father, let no weapon formed against any member of this church prosper in this season – Isa. 54:17"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 4
  {
    id: 'kf-november-4',
    month: 'November',
    day: 4,
    day_of_week: 'Tuesday',
    title: 'November 4 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the privilege of being labourers together with You in advancing Your Kingdom on earth – 1 Cor. 3:9",
      "Father, release fresh fire of evangelism upon every member of this church to win souls aggressively this month – Act. 1:8",
      "Lord Jesus, let the testimony of transformed lives in this church become a magnet that draws the unsaved to salvation – John 13:35",
      "Father, establish the works of our hands this month and let everything we set our hands to prosper – Psa. 90:17"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 5
  {
    id: 'kf-november-5',
    month: 'November',
    day: 5,
    day_of_week: 'Wednesday',
    title: 'November 5 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we destroy every satanic altar speaking against the progress and prosperity of our members this season – Isa. 54:15",
      "Father, let Your wisdom guide our leaders in making strategic decisions that will propel this church to greater heights – Jam. 1:5",
      "Lord Jesus, let the preaching of Your Word in this church continue to produce conviction, conversion, and consecration in hearts – Heb. 4:12",
      "Father, let this church be a haven of hope and healing for the broken and hurting across our harvest field – Psa. 147:3"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 6
  {
    id: 'kf-november-6',
    month: 'November',
    day: 6,
    day_of_week: 'Thursday',
    title: 'November 6 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the promise that You will finish the good work You have started in our lives – Phil. 1:6",
      "Father, let divine connections locate every member of this church this month, opening doors of uncommon opportunities – Psa. 75:6-7",
      "Lord Jesus, let the anointing for signs and wonders rest heavily upon our pastors and ministers – Mark 16:17-18",
      "Father, let every first-timer who steps into our services this week encounter Your presence and surrender their lives to You – Act. 2:37"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 7
  {
    id: 'kf-november-7',
    month: 'November',
    day: 7,
    day_of_week: 'Friday',
    title: 'November 7 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this church shall be filled with Your glory as the waters cover the sea – Hab. 2:14",
      "Father, let the fire of revival burn continuously on the altar of every heart in this congregation – 2 Tim. 1:6",
      "Lord Jesus, let our testimonies this season provoke multitudes to hunger and thirst after You – Matt. 5:6",
      "Father, grant us the grace to be faithful stewards of all the resources You have committed into our hands – Luke 16:10"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 8
  {
    id: 'kf-november-8',
    month: 'November',
    day: 8,
    day_of_week: 'Saturday',
    title: 'November 8 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for making us partakers of Your divine nature and calling us to live victoriously – 2 Pet. 1:3-4",
      "Father, let this weekend services be marked by outstanding miracles that will establish Your name in our region – John 14:12",
      "Lord Jesus, let the spirit of prayer and supplication fall fresh upon every member of this church – Zech. 12:10",
      "Father, let our giving this month open the windows of heaven over our lives, families, and businesses – Mal. 3:10"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 9
  {
    id: 'kf-november-9',
    month: 'November',
    day: 9,
    day_of_week: 'Sunday',
    title: 'November 9 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that our services today shall be a gateway to answered prayers and fulfilled destinies for all in attendance – Psa. 24:7",
      "Father, let every backslider across our harvest field return home to You this season – Luke 15:20",
      "Lord Jesus, let the atmosphere in this church be so charged with Your presence that the blind see, the deaf hear, and the lame walk – Matt. 11:5",
      "Father, establish in our hearts the reality that we are more than conquerors through Christ who loves us – Rom. 8:37"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 10
  {
    id: 'kf-november-10',
    month: 'November',
    day: 10,
    day_of_week: 'Monday',
    title: 'November 10 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for ordering our steps and causing us to walk in Your prepared paths – Psa. 37:23",
      "Father, let fresh grace for uncommon productivity rest upon every member of this church this week – 2 Cor. 9:8",
      "Lord Jesus, let the gospel we preach continue to transform lives and bring deliverance to captives – Luke 4:18",
      "Father, let supernatural provision locate every area of need in the lives of our members – Phil. 4:19"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 11
  {
    id: 'kf-november-11',
    month: 'November',
    day: 11,
    day_of_week: 'Tuesday',
    title: 'November 11 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that no plan of the enemy against this church and her members shall succeed – Job 5:12",
      "Father, let the spirit of excellence characterize everything we do in this church and in our personal lives – Dan. 5:12",
      "Lord Jesus, let Your Word continue to grow mightily and prevail in the hearts of our members – Act. 19:20",
      "Father, let every young person in this church walk in the fullness of their prophetic destiny – Joel 2:28"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 12
  {
    id: 'kf-november-12',
    month: 'November',
    day: 12,
    day_of_week: 'Wednesday',
    title: 'November 12 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the grace that has kept us and will keep us until the end – 1 Cor. 1:8",
      "Father, let the light of the gospel shine brightly through this church, dispelling darkness across our region – Matt. 5:14-16",
      "Lord Jesus, let souls be added daily to this church as we continue to preach Your Word with boldness – Act. 2:47",
      "Father, let divine health be the portion of every member of this church all through this season – Exo. 15:26"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 13
  {
    id: 'kf-november-13',
    month: 'November',
    day: 13,
    day_of_week: 'Thursday',
    title: 'November 13 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that every mountain standing in the way of our church's growth shall be removed – Zech. 4:7",
      "Father, let the spirit of unity and love reign supreme among the brethren in this church – Psa. 133:1",
      "Lord Jesus, let our prayer meetings be filled with Holy Ghost fire and power that produces results – Act. 4:31",
      "Father, let every household represented in this church be a demonstration of Your Kingdom principles – Josh. 24:15"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 14
  {
    id: 'kf-november-14',
    month: 'November',
    day: 14,
    day_of_week: 'Friday',
    title: 'November 14 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for making us ambassadors of Your Kingdom and ministers of reconciliation – 2 Cor. 5:18-20",
      "Father, let the supernatural increase in every area of our lives this season – Gen. 26:12",
      "Lord Jesus, let the gifts of the Spirit operate freely in our services, bringing edification and confirmation of Your Word – 1 Cor. 12:7-11",
      "Father, let the families in this church be fortresses of faith that cannot be shaken by the storms of life – Matt. 7:24-25"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 15
  {
    id: 'kf-november-15',
    month: 'November',
    day: 15,
    day_of_week: 'Saturday',
    title: 'November 15 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that our weekend services shall be seasons of uncommon breakthroughs and testimonies – Psa. 118:24",
      "Father, let every curse speaking against the progress of our members be broken by the power of the cross – Gal. 3:13",
      "Lord Jesus, let the reality of Your resurrection power be demonstrated in every area of our lives – Eph. 1:19-20",
      "Father, let this church be a training ground for world-changers and history-makers for Your Kingdom – Act. 1:8"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 16
  {
    id: 'kf-november-16',
    month: 'November',
    day: 16,
    day_of_week: 'Sunday',
    title: 'November 16 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let the gates of our city be opened today for multitudes to stream into this church – Isa. 60:11",
      "Father, we decree that every soul that attends our services today shall leave transformed by Your power – 2 Cor. 5:17",
      "Lord Jesus, let Your glory fill our sanctuary today, and let Your manifest presence heal, deliver, and restore – Psa. 84:11",
      "Father, let the Word preached today produce immediate and lasting fruits in the hearts of the hearers – Isa. 55:11"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 17
  {
    id: 'kf-november-17',
    month: 'November',
    day: 17,
    day_of_week: 'Monday',
    title: 'November 17 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for Your faithfulness that is new every morning toward us – Lam. 3:22-23",
      "Father, let this week bring multiple testimonies of financial breakthroughs for our members – Deut. 8:18",
      "Lord Jesus, let the anointing to win souls burn fresh in the hearts of every Winner this week – Prov. 11:30",
      "Father, let Your favor surround every member of this church as a shield all through this week – Psa. 5:12"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 18
  {
    id: 'kf-november-18',
    month: 'November',
    day: 18,
    day_of_week: 'Tuesday',
    title: 'November 18 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this church shall not struggle but shall flourish like a tree planted by rivers of water – Psa. 1:3",
      "Father, let the spirit of wisdom and revelation rest upon our pastors as they lead and teach us – Eph. 1:17",
      "Lord Jesus, let the testimonies of our members this season provoke revival across our harvest field – Act. 2:43-47",
      "Father, let every seed of the gospel planted through our outreach efforts this year yield abundant harvest – 1 Cor. 3:6-7"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 19
  {
    id: 'kf-november-19',
    month: 'November',
    day: 19,
    day_of_week: 'Wednesday',
    title: 'November 19 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the privilege of being called the righteousness of God in Christ Jesus – 2 Cor. 5:21",
      "Father, let the peace that passes understanding guard the hearts and minds of all our members – Phil. 4:7",
      "Lord Jesus, let our worship services be so powerful that angels gather to witness Your glory among us – Heb. 1:6",
      "Father, let every prayer prayed in this church this season receive speedy answers from heaven – Isa. 65:24"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 20
  {
    id: 'kf-november-20',
    month: 'November',
    day: 20,
    day_of_week: 'Thursday',
    title: 'November 20 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this church is built upon the rock, and the gates of hell shall not prevail against her – Matt. 16:18",
      "Father, let supernatural strength be renewed daily in the lives of our members as we wait upon You – Isa. 40:31",
      "Lord Jesus, let the spirit of thanksgiving overflow in the hearts of our members as we approach the season of gratitude – 1 Thess. 5:18",
      "Father, let the next generation in this church be marked by uncommon grace and supernatural exploits – Psa. 78:4-6"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 21
  {
    id: 'kf-november-21',
    month: 'November',
    day: 21,
    day_of_week: 'Friday',
    title: 'November 21 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the countless testimonies of Your goodness and mercy in our midst this year – Psa. 103:2",
      "Father, let the joy of the Lord be our strength and our testimony to a watching world – Neh. 8:10",
      "Lord Jesus, let fresh fire fall upon our altars this weekend, igniting revival in hearts and homes – 1 Kings 18:38",
      "Father, let every area of barrenness in the lives of our members become fruitful this season – Isa. 54:1"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 22
  {
    id: 'kf-november-22',
    month: 'November',
    day: 22,
    day_of_week: 'Saturday',
    title: 'November 22 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that tomorrow's services shall be marked by unusual manifestations of Your power – Mark 16:20",
      "Father, let the spirit of thanksgiving fill our hearts as we recount Your faithfulness toward us – Psa. 100:4",
      "Lord Jesus, let the seeds of righteousness sown by our members this year yield bumper harvests before December ends – 2 Cor. 9:10",
      "Father, let this church be a place where prodigals return and the lost find their way home – Luke 15:24"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 23
  {
    id: 'kf-november-23',
    month: 'November',
    day: 23,
    day_of_week: 'Sunday',
    title: 'November 23 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let every heart in our services today be open to receive the fullness of what You desire to do – Psa. 81:10",
      "Father, we decree creative miracles and instant healings in our services today – Jer. 32:27",
      "Lord Jesus, let the atmosphere of heaven invade our sanctuary today, bringing transformation to all present – 2 Chr. 7:1",
      "Father, let thanksgiving be the language of every member of this church this season – Col. 3:15"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 24
  {
    id: 'kf-november-24',
    month: 'November',
    day: 24,
    day_of_week: 'Monday',
    title: 'November 24 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for preserving our lives and bringing us to see this new week – Psa. 121:7-8",
      "Father, let this week be marked by supernatural open doors for every member of this church – Rev. 3:8",
      "Lord Jesus, let the spirit of excellence rest upon our children and youth, causing them to excel in their studies and endeavors – Dan. 1:20",
      "Father, let every financial burden be lifted from the shoulders of our members this season – Matt. 11:28"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 25
  {
    id: 'kf-november-25',
    month: 'November',
    day: 25,
    day_of_week: 'Tuesday',
    title: 'November 25 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this church shall continue to grow from strength to strength and from glory to glory – Psa. 84:7",
      "Father, let the Word of God dwell richly in our hearts, transforming us into the image of Christ – Col. 3:16",
      "Lord Jesus, let the harvest of souls be so great in these last days of the year that we run out of space – Hag. 2:7",
      "Father, let every member of this church experience tangible proof of Your faithfulness before this year ends – Deut. 7:9"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 26
  {
    id: 'kf-november-26',
    month: 'November',
    day: 26,
    day_of_week: 'Wednesday',
    title: 'November 26 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the grace that enables us to serve You and advance Your Kingdom – 1 Cor. 15:10",
      "Father, let the spirit of boldness rest upon our members to declare the gospel without fear or compromise – Act. 4:29",
      "Lord Jesus, let the fire of revival spread from this church to every corner of our city and beyond – Act. 1:8",
      "Father, let thanksgiving, rather than complaining, be the hallmark of our lives this season – Phil. 2:14"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 27
  {
    id: 'kf-november-27',
    month: 'November',
    day: 27,
    day_of_week: 'Thursday',
    title: 'November 27 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that Thanksgiving Day shall be filled with testimonies of Your goodness and mercies – Psa. 107:21-22",
      "Father, let gratitude open the gates of greater blessings in the lives of our members – Psa. 100:4",
      "Lord Jesus, let our families gather in unity, love, and thanksgiving, reflecting the beauty of Your Kingdom – Psa. 133:1",
      "Father, let this season of thanksgiving mark the beginning of greater fruitfulness and increase in our lives – Joel 2:23"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 28
  {
    id: 'kf-november-28',
    month: 'November',
    day: 28,
    day_of_week: 'Friday',
    title: 'November 28 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for bringing us through another week victoriously by Your grace – 1 Cor. 15:57",
      "Father, let the spirit of contentment and gratitude fill the hearts of all our members – 1 Tim. 6:6",
      "Lord Jesus, let the weekend services be marked by encounters with Your presence that transform lives permanently – Exo. 33:14",
      "Father, let every hindrance to the fulfillment of our prophetic destinies be removed this season – Isa. 45:2"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 29
  {
    id: 'kf-november-29',
    month: 'November',
    day: 29,
    day_of_week: 'Saturday',
    title: 'November 29 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that tomorrow's services shall close the month of November with spectacular testimonies – Mal. 3:12",
      "Father, let the spirit of preparation fill our hearts as we approach the final month of the year – Luke 12:35",
      "Lord Jesus, let this church enter December with momentum, miracles, and multiplied blessings – Deut. 28:2",
      "Father, let the testimonies of November propel us into greater exploits in December – Psa. 71:14"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // November 30
  {
    id: 'kf-november-30',
    month: 'November',
    day: 30,
    day_of_week: 'Sunday',
    title: 'November 30 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let today's services be a celebration of Your faithfulness throughout the month of November – Lam. 3:22-23",
      "Father, we decree that every seed planted and every prayer prayed in November shall yield harvest in December – Eccl. 11:1",
      "Lord Jesus, let the power of Your resurrection be demonstrated in our services today, bringing healing and deliverance – Act. 4:33",
      "Father, let this church step into December with fresh vision, renewed strength, and greater anointing – Isa. 40:29"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 1
  {
    id: 'kf-december-1',
    month: 'December',
    day: 1,
    day_of_week: 'Monday',
    title: 'December 1 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for bringing us into the final month of the year with joy and anticipation of all You will do – Psa. 65:11",
      "Father, let this month of December be marked by supernatural turnarounds and miraculous breakthroughs for every member – Isa. 61:7",
      "Lord Jesus, let fresh fire of evangelism burn in our hearts as we prepare to celebrate Your birth – Luke 2:10-11",
      "Father, let every unfinished project and delayed promise in our lives be completed and fulfilled this month – Phil. 1:6"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 2
  {
    id: 'kf-december-2',
    month: 'December',
    day: 2,
    day_of_week: 'Tuesday',
    title: 'December 2 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that the glory of this latter house shall be greater than the former as we close this year – Hag. 2:9",
      "Father, let divine acceleration visit every area of our lives, causing us to recover all that was lost or delayed – 1 Sam. 30:8",
      "Lord Jesus, let the message of Your love and salvation reach multitudes through our witness this season – John 3:16",
      "Father, let the spirit of generosity and giving overflow in the hearts of our members this Christmas season – 2 Cor. 9:7"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 3
  {
    id: 'kf-december-3',
    month: 'December',
    day: 3,
    day_of_week: 'Wednesday',
    title: 'December 3 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for preserving our lives through every storm and challenge of this year – Psa. 124:6-8",
      "Father, let the Advent season remind us of Your faithfulness in sending Jesus, and renew our hope in His return – Tit. 2:13",
      "Lord Jesus, let every service this month be marked by salvations, healings, and deliverances – Mark 16:17-18",
      "Father, let divine wisdom guide us in making the right decisions as we plan for the new year – Prov. 3:5-6"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 4
  {
    id: 'kf-december-4',
    month: 'December',
    day: 4,
    day_of_week: 'Thursday',
    title: 'December 4 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this church shall end the year with uncommon testimonies that will provoke revival – Mal. 3:12",
      "Father, let every member of this church experience financial overflow this season – Deut. 28:12",
      "Lord Jesus, let the joy of Your salvation be restored in every backslider across our harvest field – Psa. 51:12",
      "Father, let the families in this church experience unprecedented unity and love this Christmas season – Col. 3:14"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 5
  {
    id: 'kf-december-5',
    month: 'December',
    day: 5,
    day_of_week: 'Friday',
    title: 'December 5 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the gift of Jesus Christ, the greatest demonstration of Your love for humanity – John 3:16",
      "Father, let this weekend services usher in a new wave of divine encounters and life-changing miracles – Act. 19:11",
      "Lord Jesus, let the preaching of the cross continue to be the power of God unto salvation in our midst – 1 Cor. 1:18",
      "Father, let every seed sown this year germinate and yield a hundredfold harvest before December 31st – Mark 4:20"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 6
  {
    id: 'kf-december-6',
    month: 'December',
    day: 6,
    day_of_week: 'Saturday',
    title: 'December 6 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that tomorrow's services shall be a day of unusual breakthroughs and answered prayers – Jer. 33:3",
      "Father, let the atmosphere of expectation and faith fill our hearts as we gather to worship You – Heb. 11:6",
      "Lord Jesus, let the power of Your blood speak deliverance and healing over every life represented in this church – Heb. 12:24",
      "Father, let this church be a lighthouse of hope in our community, drawing the lost to salvation – Matt. 5:14"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 7
  {
    id: 'kf-december-7',
    month: 'December',
    day: 7,
    day_of_week: 'Sunday',
    title: 'December 7 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let Your glory fill our sanctuary today and let every worshipper leave transformed – 2 Chr. 5:14",
      "Father, we decree that souls shall be added to this church today, just as they were added daily in the early church – Act. 2:47",
      "Lord Jesus, let the gifts of the Spirit manifest freely in our services, confirming Your Word with signs following – Mark 16:20",
      "Father, let the message preached today penetrate hearts and produce lasting fruits – Heb. 4:12"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 8
  {
    id: 'kf-december-8',
    month: 'December',
    day: 8,
    day_of_week: 'Monday',
    title: 'December 8 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for ordering our steps and causing all things to work together for our good – Rom. 8:28",
      "Father, let this week be marked by divine open doors and uncommon favor for every member – Psa. 5:12",
      "Lord Jesus, as we prepare to celebrate Your birth, let our lives be living testimonies of Your transforming power – 2 Cor. 5:17",
      "Father, let every chain of poverty, sickness, and limitation be broken in the lives of our members this month – Luke 13:12"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 9
  {
    id: 'kf-december-9',
    month: 'December',
    day: 9,
    day_of_week: 'Tuesday',
    title: 'December 9 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree supernatural increase upon the growth and expansion of this church as we close the year – Isa. 60:22",
      "Father, let the spirit of prayer and intercession rest fresh upon every member of this church – 1 Thess. 5:17",
      "Lord Jesus, let our testimonies this season draw multitudes to seek You and experience salvation – John 4:39",
      "Father, let every plan of the enemy against our progress and destiny be frustrated this season – Isa. 8:10"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 10
  {
    id: 'kf-december-10',
    month: 'December',
    day: 10,
    day_of_week: 'Wednesday',
    title: 'December 10 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the privilege of partnering with You in advancing Your Kingdom on earth – Matt. 28:19-20",
      "Father, let divine health be the portion of every member of this church all through this season – 3 John 1:2",
      "Lord Jesus, let the reality of Your soon return keep us watchful, prayerful, and fruitful – Matt. 24:42",
      "Father, let uncommon grace for productivity and excellence rest upon our members this month – 2 Cor. 9:8"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 11
  {
    id: 'kf-december-11',
    month: 'December',
    day: 11,
    day_of_week: 'Thursday',
    title: 'December 11 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that the final weeks of this year shall be the most fruitful and rewarding for our members – Psa. 126:5-6",
      "Father, let the peace that surpasses understanding guard the hearts and minds of all our members – Phil. 4:7",
      "Lord Jesus, let fresh fire of revival fall upon our altars and ignite passion for souls – Act. 2:3-4",
      "Father, let every household in this church be a reflection of Your Kingdom principles and values – Josh. 24:15"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 12
  {
    id: 'kf-december-12',
    month: 'December',
    day: 12,
    day_of_week: 'Friday',
    title: 'December 12 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the manifold blessings and testimonies we have witnessed this year – Psa. 103:1-2",
      "Father, let this weekend services be marked by supernatural visitations and life-changing encounters – Gen. 28:16",
      "Lord Jesus, let the light of the gospel shine brightly through this church, dispelling every darkness – John 8:12",
      "Father, let divine connections and strategic relationships locate every member this season – Eccl. 4:9-10"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 13
  {
    id: 'kf-december-13',
    month: 'December',
    day: 13,
    day_of_week: 'Saturday',
    title: 'December 13 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that tomorrow's services shall be a day of uncommon miracles and testimonies – John 2:11",
      "Father, let the spirit of unity and brotherly love continue to reign in this church – Psa. 133:1",
      "Lord Jesus, let the anointing for signs and wonders rest heavily upon our ministers and members – Act. 5:12",
      "Father, let every area of barrenness in the lives of our members become fruitful before this year ends – Isa. 54:1"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 14
  {
    id: 'kf-december-14',
    month: 'December',
    day: 14,
    day_of_week: 'Sunday',
    title: 'December 14 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let our services today be a foretaste of the glory that awaits us in eternity – Rev. 21:4",
      "Father, we decree that every soul in attendance today shall encounter Your power and be transformed – Act. 9:3-5",
      "Lord Jesus, let the Word preached today produce immediate and lasting fruit in the hearts of the hearers – Luke 8:15",
      "Father, let this church continue to be a place where the impossible becomes possible – Luke 1:37"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 15
  {
    id: 'kf-december-15',
    month: 'December',
    day: 15,
    day_of_week: 'Monday',
    title: 'December 15 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for sustaining us through every challenge and bringing us to the final weeks of the year – Psa. 121:7-8",
      "Father, let this week bring multiple testimonies of answered prayers and fulfilled promises – Jer. 29:11",
      "Lord Jesus, let the spirit of expectation and faith fill our hearts as we approach Christmas – Luke 2:25-26",
      "Father, let supernatural provision locate every area of need in the lives of our members – Phil. 4:19"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 16
  {
    id: 'kf-december-16',
    month: 'December',
    day: 16,
    day_of_week: 'Tuesday',
    title: 'December 16 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this church shall end the year on a high note of unprecedented breakthroughs – Isa. 43:19",
      "Father, let the joy of the Lord fill our hearts as we celebrate the season of Your Son's birth – Neh. 8:10",
      "Lord Jesus, let every prodigal in our families and across our harvest field return home this season – Luke 15:20",
      "Father, let the seeds of the gospel planted this year yield abundant harvest now and in the new year – Gal. 6:9"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 17
  {
    id: 'kf-december-17',
    month: 'December',
    day: 17,
    day_of_week: 'Wednesday',
    title: 'December 17 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the promise that You are faithful to complete the work You have started in us – Phil. 1:6",
      "Father, let this Christmas season be marked by uncommon testimonies of Your goodness in our midst – Psa. 107:8",
      "Lord Jesus, let the preaching of Your Word continue to transform lives and establish hearts – 1 Thess. 3:13",
      "Father, let divine favor surround every member of this church like a shield – Psa. 5:12"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 18
  {
    id: 'kf-december-18',
    month: 'December',
    day: 18,
    day_of_week: 'Thursday',
    title: 'December 18 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that every mountain of impossibility in the lives of our members shall be removed – Zech. 4:7",
      "Father, let the spirit of thanksgiving overflow in our hearts as we recount Your faithfulness this year – Psa. 100:4",
      "Lord Jesus, let this church be a haven of hope and healing for the broken and hurting this season – Psa. 147:3",
      "Father, let every curse and limitation be broken by the power of the cross this Christmas season – Gal. 3:13"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 19
  {
    id: 'kf-december-19',
    month: 'December',
    day: 19,
    day_of_week: 'Friday',
    title: 'December 19 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for bringing us to the final weekend before Christmas with joy and anticipation – Psa. 118:24",
      "Father, let the weekend services be marked by powerful encounters with Your presence – Exo. 33:14",
      "Lord Jesus, as we celebrate Your birth, let multitudes come to know You as Lord and Savior – Luke 2:10-11",
      "Father, let this church step into the new year with fresh vision, renewed strength, and greater anointing – Isa. 40:31"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 20
  {
    id: 'kf-december-20',
    month: 'December',
    day: 20,
    day_of_week: 'Saturday',
    title: 'December 20 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that tomorrow's services shall be a celebration of Your faithfulness and goodness – Lam. 3:22-23",
      "Father, let the spirit of generosity and love characterize our celebrations this Christmas – 2 Cor. 8:7",
      "Lord Jesus, let Your glory fill our sanctuary tomorrow, bringing transformation to every worshipper – 2 Chr. 7:1",
      "Father, let the final days of this year be the most productive and rewarding for our members – Psa. 1:3"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 21
  {
    id: 'kf-december-21',
    month: 'December',
    day: 21,
    day_of_week: 'Sunday',
    title: 'December 21 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let our worship today be a sweet-smelling sacrifice unto You – Eph. 5:2",
      "Father, we decree salvations, healings, and deliverances in our services today – Mark 16:17-18",
      "Lord Jesus, let the message of Christmas penetrate hearts and draw multitudes to salvation – Luke 2:14",
      "Father, let the testimonies of this year propel us into greater exploits in the new year – Josh. 4:7"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 22
  {
    id: 'kf-december-22',
    month: 'December',
    day: 22,
    day_of_week: 'Monday',
    title: 'December 22 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for preserving our lives and bringing us to this Christmas week – Psa. 116:8-9",
      "Father, let this week be marked by divine encounters, miracles, and testimonies – Act. 10:38",
      "Lord Jesus, let the celebration of Your birth renew our commitment to live for You – 2 Cor. 5:15",
      "Father, let every delayed blessing and promise be released into the lives of our members this week – Hab. 2:3"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 23
  {
    id: 'kf-december-23',
    month: 'December',
    day: 23,
    day_of_week: 'Tuesday',
    title: 'December 23 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this Christmas season shall be the best our members have ever experienced – Joel 2:25",
      "Father, let the peace of God that passes understanding rest upon every household in this church – Phil. 4:7",
      "Lord Jesus, let the message of Your love and salvation reach the ends of the earth through our witness – Act. 1:8",
      "Father, let supernatural provision and abundance be the portion of every member this season – Mal. 3:10"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 24 (Christmas Eve)
  {
    id: 'kf-december-24',
    month: 'December',
    day: 24,
    day_of_week: 'Wednesday',
    title: 'December 24 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the gift of Jesus Christ, the hope of glory and Savior of the world – Col. 1:27",
      "Father, let this Christmas Eve be marked by family reunions, reconciliation, and restoration – Luke 1:17",
      "Lord Jesus, let the joy of Your birth fill every heart and home with peace and love – Luke 2:10-11",
      "Father, let every celebration in our homes this season glorify Your name and draw souls to You – 1 Cor. 10:31"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 25 (Christmas Day)
  {
    id: 'kf-december-25',
    month: 'December',
    day: 25,
    day_of_week: 'Thursday',
    title: 'December 25 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we celebrate the birth of Jesus Christ, the Light of the world and Prince of Peace – Isa. 9:6",
      "Father, let this Christmas Day be filled with testimonies of Your goodness and mercies – Psa. 118:1",
      "Lord Jesus, thank You for leaving the glory of heaven to bring salvation to lost humanity – Phil. 2:6-8",
      "Father, let the reality of Emmanuel (God with us) be our strength and joy today and always – Matt. 1:23"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 26
  {
    id: 'kf-december-26',
    month: 'December',
    day: 26,
    day_of_week: 'Friday',
    title: 'December 26 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for the joy and blessings of Christmas that we have experienced – Psa. 16:11",
      "Father, let the spirit of gratitude and thanksgiving continue to fill our hearts – 1 Thess. 5:18",
      "Lord Jesus, as we prepare to step into a new year, let Your wisdom guide us in all our plans – Jam. 1:5",
      "Father, let every member of this church finish the year strong and step into the new year with victory – 2 Cor. 2:14"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 27
  {
    id: 'kf-december-27',
    month: 'December',
    day: 27,
    day_of_week: 'Saturday',
    title: 'December 27 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that tomorrow's services shall be a powerful send-off into the new year – Psa. 20:4",
      "Father, let the final weekend of this year be marked by supernatural breakthroughs and testimonies – Isa. 43:19",
      "Lord Jesus, let the anointing for miracles rest heavily upon our services as we close the year – John 14:12",
      "Father, let every member of this church enter the new year with clear vision and divine direction – Prov. 29:18"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 28
  {
    id: 'kf-december-28',
    month: 'December',
    day: 28,
    day_of_week: 'Sunday',
    title: 'December 28 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, let our final Sunday service of the year be a celebration of Your faithfulness – Lam. 3:22-23",
      "Father, we decree that every worshipper today shall receive fresh fire and anointing for the new year – 2 Tim. 1:6",
      "Lord Jesus, let Your glory fill our sanctuary today, and let testimonies of the year provoke praise – Psa. 66:16",
      "Father, let the Word preached today prepare our hearts to possess our possessions in the new year – Obad. 1:17"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 29
  {
    id: 'kf-december-29',
    month: 'December',
    day: 29,
    day_of_week: 'Monday',
    title: 'December 29 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for bringing us through this year victoriously by Your grace – 1 Cor. 15:57",
      "Father, let these final days of the year be marked by reflection, thanksgiving, and preparation – Psa. 143:5",
      "Lord Jesus, let the lessons learned this year position us for greater exploits in the new year – Isa. 42:9",
      "Father, let every seed sown this year yield maximum harvest in the new year and beyond – 2 Cor. 9:10"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 30
  {
    id: 'kf-december-30',
    month: 'December',
    day: 30,
    day_of_week: 'Tuesday',
    title: 'December 30 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, we decree that this penultimate day of the year shall be filled with testimonies and praise – Psa. 150:6",
      "Father, let the spirit of expectation and faith fill our hearts as we approach the new year – Heb. 11:1",
      "Lord Jesus, let every member of this church be positioned for uncommon favor in the new year – Gen. 39:21",
      "Father, let the grace that carried us through this year be multiplied in the new year – 2 Pet. 1:2"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  },
  // December 31 (New Year's Eve)
  {
    id: 'kf-december-31',
    month: 'December',
    day: 31,
    day_of_week: 'Wednesday',
    title: 'December 31 Intercessions',
    category: 'Kingdom Focused',
    intercession_points: [
      "Father, thank You for Your faithfulness, mercies, and grace that have brought us to the end of this year – Lam. 3:22-23",
      "Father, we decree that this church and her members shall step into the new year with uncommon testimonies – Psa. 126:2-3",
      "Lord Jesus, as we cross over into the new year, let old things pass away and all things become new – 2 Cor. 5:17",
      "Father, let the new year be marked by supernatural increase, divine health, and unprecedented breakthroughs for every member – Jer. 29:11"
    ],
    is_placeholder: false,
    created_at: new Date().toISOString()
  }
];

// ============================================
// 3. PROVERBS 91-DAY READING PLAN WITH REAL KJV VERSES
// ============================================

// Complete KJV Proverbs text organized by chapter (all 31 chapters)
const proverbsKJV: { [key: number]: string[] } = {
  1: ["The proverbs of Solomon the son of David, king of Israel;", "To know wisdom and instruction; to perceive the words of understanding;", "To receive the instruction of wisdom, justice, and judgment, and equity;", "To give subtilty to the simple, to the young man knowledge and discretion.", "A wise man will hear, and will increase learning; and a man of understanding shall attain unto wise counsels:", "To understand a proverb, and the interpretation; the words of the wise, and their dark sayings.", "The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction.", "My son, hear the instruction of thy father, and forsake not the law of thy mother:", "For they shall be an ornament of grace unto thy head, and chains about thy neck.", "My son, if sinners entice thee, consent thou not.", "If they say, Come with us, let us lay wait for blood, let us lurk privily for the innocent without cause:", "Let us swallow them up alive as the grave; and whole, as those that go down into the pit:", "We shall find all precious substance, we shall fill our houses with spoil:", "Cast in thy lot among us; let us all have one purse:", "My son, walk not thou in the way with them; refrain thy foot from their path:", "For their feet run to evil, and make haste to shed blood.", "Surely in vain the net is spread in the sight of any bird.", "And they lay wait for their own blood; they lurk privily for their own lives.", "So are the ways of every one that is greedy of gain; which taketh away the life of the owners thereof.", "Wisdom crieth without; she uttereth her voice in the streets:", "She crieth in the chief place of concourse, in the openings of the gates: in the city she uttereth her words, saying,", "How long, ye simple ones, will ye love simplicity? and the scorners delight in their scorning, and fools hate knowledge?", "Turn you at my reproof: behold, I will pour out my spirit unto you, I will make known my words unto you.", "Because I have called, and ye refused; I have stretched out my hand, and no man regarded;", "But ye have set at nought all my counsel, and would none of my reproof:", "I also will laugh at your calamity; I will mock when your fear cometh;", "When your fear cometh as desolation, and your destruction cometh as a whirlwind; when distress and anguish cometh upon you.", "Then shall they call upon me, but I will not answer; they shall seek me early, but they shall not find me:", "For that they hated knowledge, and did not choose the fear of the LORD:", "They would none of my counsel: they despised all my reproof.", "Therefore shall they eat of the fruit of their own way, and be filled with their own devices.", "For the turning away of the simple shall slay them, and the prosperity of fools shall destroy them.", "But whoso hearkeneth unto me shall dwell safely, and shall be quiet from fear of evil."],
  2: ["My son, if thou wilt receive my words, and hide my commandments with thee;", "So that thou incline thine ear unto wisdom, and apply thine heart to understanding;", "Yea, if thou criest after knowledge, and liftest up thy voice for understanding;", "If thou seekest her as silver, and searchest for her as for hid treasures;", "Then shalt thou understand the fear of the LORD, and find the knowledge of God.", "For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.", "He layeth up sound wisdom for the righteous: he is a buckler to them that walk uprightly.", "He keepeth the paths of judgment, and preserveth the way of his saints.", "Then shalt thou understand righteousness, and judgment, and equity; yea, every good path.", "When wisdom entereth into thine heart, and knowledge is pleasant unto thy soul;", "Discretion shall preserve thee, understanding shall keep thee:", "To deliver thee from the way of the evil man, from the man that speaketh froward things;", "Who leave the paths of uprightness, to walk in the ways of darkness;", "Who rejoice to do evil, and delight in the frowardness of the wicked;", "Whose ways are crooked, and they froward in their paths:", "To deliver thee from the strange woman, even from the stranger which flattereth with her words;", "Which forsaketh the guide of her youth, and forgetteth the covenant of her God.", "For her house inclineth unto death, and her paths unto the dead.", "None that go unto her return again, neither take they hold of the paths of life.", "That thou mayest walk in the way of good men, and keep the paths of the righteous.", "For the upright shall dwell in the land, and the perfect shall remain in it.", "But the wicked shall be cut off from the earth, and the transgressors shall be rooted out of it."],
  3: ["My son, forget not my law; but let thine heart keep my commandments:", "For length of days, and long life, and peace, shall they add to thee.", "Let not mercy and truth forsake thee: bind them about thy neck; write them upon the table of thine heart:", "So shalt thou find favour and good understanding in the sight of God and man.", "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", "In all thy ways acknowledge him, and he shall direct thy paths.", "Be not wise in thine own eyes: fear the LORD, and depart from evil.", "It shall be health to thy navel, and marrow to thy bones.", "Honour the LORD with thy substance, and with the firstfruits of all thine increase:", "So shall thy barns be filled with plenty, and thy presses shall burst out with new wine.", "My son, despise not the chastening of the LORD; neither be weary of his correction:", "For whom the LORD loveth he correcteth; even as a father the son in whom he delighteth.", "Happy is the man that findeth wisdom, and the man that getteth understanding.", "For the merchandise of it is better than the merchandise of silver, and the gain thereof than fine gold.", "She is more precious than rubies: and all the things thou canst desire are not to be compared unto her.", "Length of days is in her right hand; and in her left hand riches and honour.", "Her ways are ways of pleasantness, and all her paths are peace.", "She is a tree of life to them that lay hold upon her: and happy is every one that retaineth her.", "The LORD by wisdom hath founded the earth; by understanding hath he established the heavens.", "By his knowledge the depths are broken up, and the clouds drop down the dew.", "My son, let not them depart from thine eyes: keep sound wisdom and discretion:", "So shall they be life unto thy soul, and grace to thy neck.", "Then shalt thou walk in thy way safely, and thy foot shall not stumble.", "When thou liest down, thou shalt not be afraid: yea, thou shalt lie down, and thy sleep shall be sweet.", "Be not afraid of sudden fear, neither of the desolation of the wicked, when it cometh.", "For the LORD shall be thy confidence, and shall keep thy foot from being taken.", "Withhold not good from them to whom it is due, when it is in the power of thine hand to do it.", "Say not unto thy neighbour, Go, and come again, and to morrow I will give; when thou hast it by thee.", "Devise not evil against thy neighbour, seeing he dwelleth securely by thee.", "Strive not with a man without cause, if he have done thee no harm.", "Envy thou not the oppressor, and choose none of his ways.", "For the froward is abomination to the LORD: but his secret is with the righteous.", "The curse of the LORD is in the house of the wicked: but he blesseth the habitation of the just.", "Surely he scorneth the scorners: but he giveth grace unto the lowly.", "The wise shall inherit glory: but shame shall be the promotion of fools."],
  4: ["Hear, ye children, the instruction of a father, and attend to know understanding.", "For I give you good doctrine, forsake ye not my law.", "For I was my father's son, tender and only beloved in the sight of my mother.", "He taught me also, and said unto me, Let thine heart retain my words: keep my commandments, and live.", "Get wisdom, get understanding: forget it not; neither decline from the words of my mouth.", "Forsake her not, and she shall preserve thee: love her, and she shall keep thee.", "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.", "Exalt her, and she shall promote thee: she shall bring thee to honour, when thou dost embrace her.", "She shall give to thine head an ornament of grace: a crown of glory shall she deliver to thee.", "Hear, O my son, and receive my sayings; and the years of thy life shall be many.", "I have taught thee in the way of wisdom; I have led thee in right paths.", "When thou goest, thy steps shall not be straitened; and when thou runnest, thou shalt not stumble.", "Take fast hold of instruction; let her not go: keep her; for she is thy life.", "Enter not into the path of the wicked, and go not in the way of evil men.", "Avoid it, pass not by it, turn from it, and pass away.", "For they sleep not, except they have done mischief; and their sleep is taken away, unless they cause some to fall.", "For they eat the bread of wickedness, and drink the wine of violence.", "But the path of the just is as the shining light, that shineth more and more unto the perfect day.", "The way of the wicked is as darkness: they know not at what they stumble.", "My son, attend to my words; incline thine ear unto my sayings.", "Let them not depart from thine eyes; keep them in the midst of thine heart.", "For they are life unto those that find them, and health to all their flesh.", "Keep thy heart with all diligence; for out of it are the issues of life.", "Put away from thee a froward mouth, and perverse lips put far from thee.", "Let thine eyes look right on, and let thine eyelids look straight before thee.", "Ponder the path of thy feet, and let all thy ways be established.", "Turn not to the right hand nor to the left: remove thy foot from evil."],
  5: ["My son, attend unto my wisdom,\nand bow thine ear to my understanding:", "That thou mayest regard discretion, and\nthat thy lips may keep knowledge.", "For the lips of a strange woman drop\nas an honeycomb, and her mouth\nis smoother than oil:", "But her end is bitter as wormwood, sharp as a twoedged sword.", "Her feet go down to death; her steps take hold on hell.", "Lest thou shouldest ponder the path of life, her ways are moveable,\nthat thou canst not know\nthem.", "Hear me now therefore, O ye children, and depart not from the words of my mouth.", "Remove thy way far from her, and come not nigh the door of her house:", "Lest thou give thine honour unto others, and thy years unto the cruel:", "Lest strangers be filled with thy wealth; and thy labours\nbe\n in the house of a stranger;", "And thou mourn at the last, when thy flesh and thy body are consumed,", "And say, How have I hated instruction, and my heart despised reproof;", "And have not obeyed the voice of my teachers, nor inclined mine ear to them that instructed me!", "I was almost in all evil in the midst of the congregation and assembly.", "Drink waters out of thine own cistern, and running waters out of thine own well.", "Let thy fountains be dispersed abroad,\nand rivers of waters in the streets.", "Let them be only thine own, and not strangers' with thee.", "Let thy fountain be blessed: and rejoice with the wife of thy youth.", "Let her be as the loving hind and pleasant roe; let her breasts satisfy thee at all times; and be thou ravished always with her love.", "And why wilt thou, my son, be ravished with a strange woman, and embrace the bosom of a stranger?", "For the ways of man\nare before the eyes of the LORD, and he pondereth all his goings.", "His own iniquities shall take the wicked himself, and he shall be holden with the cords of his sins.", "He shall die without instruction; and in the greatness of his folly he shall go astray."],
  6: ["My son, if thou be surety for thy friend, if thou hast stricken thy hand with a stranger,", "Thou art snared with the words of thy mouth, thou art taken with the words of thy mouth.", "Do this now, my son, deliver thyself, when thou art come into the hand of thy friend; go, humble thyself, and make sure thy friend.", "Give not sleep to thine eyes, nor slumber to thine eyelids.", "Deliver thyself as a roe from the hand of the hunter, and as a bird from the hand of the fowler.", "Go to the ant, thou sluggard; consider her ways, and be wise:", "Which having no guide, overseer, or ruler,", "Provideth her meat in the summer, and gathereth her food in the harvest.", "How long wilt thou sleep, O sluggard? when wilt thou arise out of thy sleep?", "Yet a little sleep, a little slumber, a little folding of the hands to sleep:", "So shall thy poverty come as one that travelleth, and thy want as an armed man.", "A naughty person, a wicked man, walketh with a froward mouth.", "He winketh with his eyes, he speaketh with his feet, he teacheth with his fingers;", "Frowardness is in his heart, he deviseth mischief continually; he soweth discord.", "Therefore shall his calamity come suddenly; suddenly shall he be broken without remedy.", "These six things doth the LORD hate: yea, seven are an abomination unto him:", "A proud look, a lying tongue, and hands that shed innocent blood,", "An heart that deviseth wicked imaginations, feet that be swift in running to mischief,", "A false witness that speaketh lies, and he that soweth discord among brethren.", "My son, keep thy father's commandment, and forsake not the law of thy mother:", "Bind them continually upon thine heart, and tie them about thy neck.", "When thou goest, it shall lead thee; when thou sleepest, it shall keep thee; and when thou awakest, it shall talk with thee.", "For the commandment is a lamp; and the law is light; and reproofs of instruction are the way of life:", "To keep thee from the evil woman, from the flattery of the tongue of a strange woman.", "Lust not after her beauty in thine heart; neither let her take thee with her eyelids.", "For by means of a whorish woman a man is brought to a piece of bread: and the adulteress will hunt for the precious life.", "Can a man take fire in his bosom, and his clothes not be burned?", "Can one go upon hot coals, and his feet not be burned?", "So he that goeth in to his neighbour's wife; whosoever toucheth her shall not be innocent.", "Men do not despise a thief, if he steal to satisfy his soul when he is hungry;", "But if he be found, he shall restore sevenfold; he shall give all the substance of his house.", "But whoso committeth adultery with a woman lacketh understanding: he that doeth it destroyeth his own soul.", "A wound and dishonour shall he get; and his reproach shall not be wiped away.", "For jealousy is the rage of a man: therefore he will not spare in the day of vengeance.", "He will not regard any ransom; neither will he rest content, though thou givest many gifts."],
  7: ["My son, keep my words, and lay up my commandments with thee.", "Keep my commandments, and live; and my law as the apple of thine eye.", "Bind them upon thy fingers, write them upon the table of thine heart.", "Say unto wisdom, Thou art my sister; and call understanding thy kinswoman:", "That they may keep thee from the strange woman, from the stranger which flattereth with her words.", "For at the window of my house I looked through my casement,", "And beheld among the simple ones, I discerned among the youths, a young man void of understanding,", "Passing through the street near her corner; and he went the way to her house,", "In the twilight, in the evening, in the black and dark night:", "And, behold, there met him a woman with the attire of an harlot, and subtil of heart.", "She is loud and stubborn; her feet abide not in her house:", "Now is she without, now in the streets, and lieth in wait at every corner.", "So she caught him, and kissed him, and with an impudent face said unto him,", "I have peace offerings with me; this day have I payed my vows.", "Therefore came I forth to meet thee, diligently to seek thy face, and I have found thee.", "I have decked my bed with coverings of tapestry, with carved works, with fine linen of Egypt.", "I have perfumed my bed with myrrh, aloes, and cinnamon.", "Come, let us take our fill of love until the morning: let us solace ourselves with loves.", "For the goodman is not at home, he is gone a long journey:", "He hath taken a bag of money with him, and will come home at the day appointed.", "With her much fair speech she caused him to yield, with the flattering of her lips she forced him.", "He goeth after her straightway, as an ox goeth to the slaughter, or as a fool to the correction of the stocks;", "Till a dart strike through his liver; as a bird hasteth to the snare, and knoweth not that it is for his life.", "Hearken unto me now therefore, O ye children, and attend to the words of my mouth.", "Let not thine heart decline to her ways, go not astray in her paths.", "For she hath cast down many wounded: yea, many strong men have been slain by her.", "Her house is the way to hell, going down to the chambers of death."],
  8: ["Doth not wisdom cry? and understanding put forth her voice?", "She standeth in the top of high places, by the way in the places of the paths.", "She crieth at the gates, at the entry of the city, at the coming in at the doors.", "Unto you, O men, I call; and my voice is to the sons of man.", "O ye simple, understand wisdom: and, ye fools, be ye of an understanding heart.", "Hear; for I will speak of excellent things; and the opening of my lips shall be right things.", "For my mouth shall speak truth; and wickedness is an abomination to my lips.", "All the words of my mouth are in righteousness; there is nothing froward or perverse in them.", "They are all plain to him that understandeth, and right to them that find knowledge.", "Receive my instruction, and not silver; and knowledge rather than choice gold.", "For wisdom is better than rubies; and all the things that may be desired are not to be compared to it.", "I wisdom dwell with prudence, and find out knowledge of witty inventions.", "The fear of the LORD is to hate evil: pride, and arrogancy, and the evil way, and the froward mouth, do I hate.", "Counsel is mine, and sound wisdom: I am understanding; I have strength.", "By me kings reign, and princes decree justice.", "By me princes rule, and nobles, even all the judges of the earth.", "I love them that love me; and those that seek me early shall find me.", "Riches and honour are with me; yea, durable riches and righteousness.", "My fruit is better than gold, yea, than fine gold; and my revenue than choice silver.", "I lead in the way of righteousness, in the midst of the paths of judgment:", "That I may cause those that love me to inherit substance; and I will fill their treasures.", "The LORD possessed me in the beginning of his way, before his works of old.", "I was set up from everlasting, from the beginning, or ever the earth was.", "When there were no depths, I was brought forth; when there were no fountains abounding with water.", "Before the mountains were settled, before the hills was I brought forth:", "While as yet he had not made the earth, nor the fields, nor the highest part of the dust of the world.", "When he prepared the heavens, I was there: when he set a compass upon the face of the depth:", "When he established the clouds above: when he strengthened the fountains of the deep:", "When he gave to the sea his decree, that the waters should not pass his commandment: when he appointed the foundations of the earth:", "Then I was by him, as one brought up with him: and I was daily his delight, rejoicing always before him;", "Rejoicing in the habitable part of his earth; and my delights were with the sons of men.", "Now therefore hearken unto me, O ye children: for blessed are they that keep my ways.", "Hear instruction, and be wise, and refuse it not.", "Blessed is the man that heareth me, watching daily at my gates, waiting at the posts of my doors.", "For whoso findeth me findeth life, and shall obtain favour of the LORD.", "But he that sinneth against me wrongeth his own soul: all they that hate me love death."],
  9: ["Wisdom hath builded her house, she hath hewn out her seven pillars:", "She hath killed her beasts; she hath mingled her wine; she hath also furnished her table.", "She hath sent forth her maidens: she crieth upon the highest places of the city,", "Whoso is simple, let him turn in hither: as for him that wanteth understanding, she saith to him,", "Come, eat of my bread, and drink of the wine which I have mingled.", "Forsake the foolish, and live; and go in the way of understanding.", "He that reproveth a scorner getteth to himself shame: and he that rebuketh a wicked man getteth himself a blot.", "Reprove not a scorner, lest he hate thee: rebuke a wise man, and he will love thee.", "Give instruction to a wise man, and he will be yet wiser: teach a just man, and he will increase in learning.", "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.", "For by me thy days shall be multiplied, and the years of thy life shall be increased.", "If thou be wise, thou shalt be wise for thyself: but if thou scornest, thou alone shalt bear it.", "A foolish woman is clamorous: she is simple, and knoweth nothing.", "For she sitteth at the door of her house, on a seat in the high places of the city,", "To call passengers who go right on their ways:", "Whoso is simple, let him turn in hither: and as for him that wanteth understanding, she saith to him,", "Stolen waters are sweet, and bread eaten in secret is pleasant.", "But he knoweth not that the dead are there; and that her guests are in the depths of hell."],
  10: ["The proverbs of Solomon. A wise son maketh a glad father: but a foolish son is the heaviness of his mother.", "Treasures of wickedness profit nothing: but righteousness delivereth from death.", "The LORD will not suffer the soul of the righteous to famish: but he casteth away the substance of the wicked.", "He becometh poor that dealeth with a slack hand: but the hand of the diligent maketh rich.", "He that gathereth in summer is a wise son: but he that sleepeth in harvest is a son that causeth shame.", "Blessings are upon the head of the just: but violence covereth the mouth of the wicked.", "The memory of the just is blessed: but the name of the wicked shall rot.", "The wise in heart will receive commandments: but a prating fool shall fall.", "He that walketh uprightly walketh surely: but he that perverteth his ways shall be known.", "He that winketh with the eye causeth sorrow: but a prating fool shall fall.", "The mouth of a righteous man is a well of life: but violence covereth the mouth of the wicked.", "Hatred stirreth up strifes: but love covereth all sins.", "In the lips of him that hath understanding wisdom is found: but a rod is for the back of him that is void of understanding.", "Wise men lay up knowledge: but the mouth of the foolish is near destruction.", "The rich man's wealth is his strong city: the destruction of the poor is their poverty.", "The labour of the righteous tendeth to life: the fruit of the wicked to sin.", "He is in the way of life that keepeth instruction: but he that refuseth reproof erreth.", "He that hideth hatred with lying lips, and he that uttereth a slander, is a fool.", "In the multitude of words there wanteth not sin: but he that refraineth his lips is wise.", "The tongue of the just is as choice silver: the heart of the wicked is little worth.", "The lips of the righteous feed many: but fools die for want of wisdom.", "The blessing of the LORD, it maketh rich, and he addeth no sorrow with it.", "It is as sport to a fool to do mischief: but a man of understanding hath wisdom.", "The fear of the wicked, it shall come upon him: but the desire of the righteous shall be granted.", "As the whirlwind passeth, so is the wicked no more: but the righteous is an everlasting foundation.", "As vinegar to the teeth, and as smoke to the eyes, so is the sluggard to them that send him.", "The fear of the LORD prolongeth days: but the years of the wicked shall be shortened.", "The hope of the righteous shall be gladness: but the expectation of the wicked shall perish.", "The way of the LORD is strength to the upright: but destruction shall be to the workers of iniquity.", "The righteous shall never be removed: but the wicked shall not inhabit the earth.", "The mouth of the just bringeth forth wisdom: but the froward tongue shall be cut out.", "The lips of the righteous know what is acceptable: but the mouth of the wicked speaketh frowardness."],
  11: ["A false balance is abomination to the LORD: but a just weight is his delight.", "When pride cometh, then cometh shame: but with the lowly is wisdom.", "The integrity of the upright shall guide them: but the perverseness of transgressors shall destroy them.", "Riches profit not in the day of wrath: but righteousness delivereth from death.", "The righteousness of the perfect shall direct his way: but the wicked shall fall by his own wickedness.", "The righteousness of the upright shall deliver them: but transgressors shall be taken in their own naughtiness.", "When a wicked man dieth, his expectation shall perish: and the hope of unjust men perisheth.", "The righteous is delivered out of trouble, and the wicked cometh in his stead.", "An hypocrite with his mouth destroyeth his neighbour: but through knowledge shall the just be delivered.", "When it goeth well with the righteous, the city rejoiceth: and when the wicked perish, there is shouting.", "By the blessing of the upright the city is exalted: but it is overthrown by the mouth of the wicked.", "He that is void of wisdom despiseth his neighbour: but a man of understanding holdeth his peace.", "A talebearer revealeth secrets: but he that is of a faithful spirit concealeth the matter.", "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.", "He that is surety for a stranger shall smart for it: and he that hateth suretiship is sure.", "A gracious woman retaineth honour: and strong men retain riches.", "The merciful man doeth good to his own soul: but he that is cruel troubleth his own flesh.", "The wicked worketh a deceitful work: but to him that soweth righteousness shall be a sure reward.", "As righteousness tendeth to life: so he that pursueth evil pursueth it to his own death.", "They that are of a froward heart are abomination to the LORD: but such as are upright in their way are his delight.", "Though hand join in hand, the wicked shall not be unpunished: but the seed of the righteous shall be delivered.", "As a jewel of gold in a swine's snout, so is a fair woman which is without discretion.", "The desire of the righteous is only good: but the expectation of the wicked is wrath.", "There is that scattereth, and yet increaseth; and there is that withholdeth more than is meet, but it tendeth to poverty.", "The liberal soul shall be made fat: and he that watereth shall be watered also himself.", "He that withholdeth corn, the people shall curse him: but blessing shall be upon the head of him that selleth it.", "He that diligently seeketh good procureth favour: but he that seeketh mischief, it shall come unto him.", "He that trusteth in his riches shall fall: but the righteous shall flourish as a branch.", "He that troubleth his own house shall inherit the wind: and the fool shall be servant to the wise of heart.", "The fruit of the righteous is a tree of life; and he that winneth souls is wise.", "Behold, the righteous shall be recompensed in the earth: much more the wicked and the sinner."],
  12: ["Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish.", "A good man obtaineth favour of the LORD: but a man of wicked devices will he condemn.", "A man shall not be established by wickedness: but the root of the righteous shall not be moved.", "A virtuous woman is a crown to her husband: but she that maketh ashamed is as rottenness in his bones.", "The thoughts of the righteous are right: but the counsels of the wicked are deceit.", "The words of the wicked are to lie in wait for blood: but the mouth of the upright shall deliver them.", "The wicked are overthrown, and are not: but the house of the righteous shall stand.", "A man shall be commended according to his wisdom: but he that is of a perverse heart shall be despised.", "He that is despised, and hath a servant, is better than he that honoureth himself, and lacketh bread.", "A righteous man regardeth the life of his beast: but the tender mercies of the wicked are cruel.", "He that tilleth his land shall be satisfied with bread: but he that followeth vain persons is void of understanding.", "The wicked desireth the net of evil men: but the root of the righteous yieldeth fruit.", "The wicked is snared by the transgression of his lips: but the just shall come out of trouble.", "A man shall be satisfied with good by the fruit of his mouth: and the recompense of a man's hands shall be rendered unto him.", "The way of a fool is right in his own eyes: but he that hearkeneth unto counsel is wise.", "A fool's wrath is presently known: but a prudent man covereth shame.", "He that speaketh truth sheweth forth righteousness: but a false witness deceit.", "There is that speaketh like the piercings of a sword: but the tongue of the wise is health.", "The lip of truth shall be established for ever: but a lying tongue is but for a moment.", "Deceit is in the heart of them that imagine evil: but to the counsellors of peace is joy.", "There shall no evil happen to the just: but the wicked shall be filled with mischief.", "Lying lips are abomination to the LORD: but they that deal truly are his delight.", "A prudent man concealeth knowledge: but the heart of fools proclaimeth foolishness.", "The hand of the diligent shall bear rule: but the slothful shall be under tribute.", "Heaviness in the heart of man maketh it stoop: but a good word maketh it glad.", "The righteous is more excellent than his neighbour: but the way of the wicked seduceth them.", "The slothful man roasteth not that which he took in hunting: but the substance of a diligent man is precious.", "In the way of righteousness is life; and in the pathway thereof there is no death."],
  13: ["A wise son heareth his father's instruction: but a scorner heareth not rebuke.", "A man shall eat good by the fruit of his mouth: but the soul of the transgressors shall eat violence.", "He that keepeth his mouth keepeth his life: but he that openeth wide his lips shall have destruction.", "The soul of the sluggard desireth, and hath nothing: but the soul of the diligent shall be made fat.", "A righteous man hateth lying: but a wicked man is loathsome, and cometh to shame.", "Righteousness keepeth him that is upright in the way: but wickedness overthroweth the sinner.", "There is that maketh himself rich, yet hath nothing: there is that maketh himself poor, yet hath great riches.", "The ransom of a man's life are his riches: but the poor heareth not rebuke.", "The light of the righteous rejoiceth: but the lamp of the wicked shall be put out.", "Only by pride cometh contention: but with the well advised is wisdom.", "Wealth gotten by vanity shall be diminished: but he that gathereth by labour shall increase.", "Hope deferred maketh the heart sick: but when the desire cometh, it is a tree of life.", "Whoso despiseth the word shall be destroyed: but he that feareth the commandment shall be rewarded.", "The law of the wise is a fountain of life, to depart from the snares of death.", "Good understanding giveth favour: but the way of transgressors is hard.", "Every prudent man dealeth with knowledge: but a fool layeth open his folly.", "A wicked messenger falleth into mischief: but a faithful ambassador is health.", "Poverty and shame shall be to him that refuseth instruction: but he that regardeth reproof shall be honoured.", "The desire accomplished is sweet to the soul: but it is abomination to fools to depart from evil.", "He that walketh with wise men shall be wise: but a companion of fools shall be destroyed.", "Evil pursueth sinners: but to the righteous good shall be repaid.", "A good man leaveth an inheritance to his children's children: and the wealth of the sinner is laid up for the just.", "Much food is in the tillage of the poor: but there is that is destroyed for want of judgment.", "He that spareth his rod hateth his son: but he that loveth him chasteneth him betimes.", "The righteous eateth to the satisfying of his soul: but the belly of the wicked shall want."],
  14: ["Every wise woman buildeth her house: but the foolish plucketh it down with her hands.", "He that walketh in his uprightness feareth the LORD: but he that is perverse in his ways despiseth him.", "In the mouth of the foolish is a rod of pride: but the lips of the wise shall preserve them.", "Where no oxen are, the crib is clean: but much increase is by the strength of the ox.", "A faithful witness will not lie: but a false witness will utter lies.", "A scorner seeketh wisdom, and findeth it not: but knowledge is easy unto him that understandeth.", "Go from the presence of a foolish man, when thou perceivest not in him the lips of knowledge.", "The wisdom of the prudent is to understand his way: but the folly of fools is deceit.", "Fools make a mock at sin: but among the righteous there is favour.", "The heart knoweth his own bitterness; and a stranger doth not intermeddle with his joy.", "The house of the wicked shall be overthrown: but the tabernacle of the upright shall flourish.", "There is a way which seemeth right unto a man, but the end thereof are the ways of death.", "Even in laughter the heart is sorrowful; and the end of that mirth is heaviness.", "The backslider in heart shall be filled with his own ways: and a good man shall be satisfied from himself.", "The simple believeth every word: but the prudent man looketh well to his going.", "A wise man feareth, and departeth from evil: but the fool rageth, and is confident.", "He that is soon angry dealeth foolishly: and a man of wicked devices is hated.", "The simple inherit folly: but the prudent are crowned with knowledge.", "The evil bow before the good; and the wicked at the gates of the righteous.", "The poor is hated even of his own neighbour: but the rich hath many friends.", "He that despiseth his neighbour sinneth: but he that hath mercy on the poor, happy is he.", "Do they not err that devise evil? but mercy and truth shall be to them that devise good.", "In all labour there is profit: but the talk of the lips tendeth only to penury.", "The crown of the wise is their riches: but the foolishness of fools is folly.", "A true witness delivereth souls: but a deceitful witness speaketh lies.", "In the fear of the LORD is strong confidence: and his children shall have a place of refuge.", "The fear of the LORD is a fountain of life, to depart from the snares of death.", "In the multitude of people is the king's honour: but in the want of people is the destruction of the prince.", "He that is slow to wrath is of great understanding: but he that is hasty of spirit exalteth folly.", "A sound heart is the life of the flesh: but envy the rottenness of the bones.", "He that oppresseth the poor reproacheth his Maker: but he that honoureth him hath mercy on the poor.", "The wicked is driven away in his wickedness: but the righteous hath hope in his death.", "Wisdom resteth in the heart of him that hath understanding: but that which is in the midst of fools is made known.", "Righteousness exalteth a nation: but sin is a reproach to any people.", "The king's favour is toward a wise servant: but his wrath is against him that causeth shame."],
  15: ["A soft answer turneth away wrath: but grievous words stir up anger.", "The tongue of the wise useth knowledge aright: but the mouth of fools poureth out foolishness.", "The eyes of the LORD are in every place, beholding the evil and the good.", "A wholesome tongue is a tree of life: but perverseness therein is a breach in the spirit.", "A fool despiseth his father's instruction: but he that regardeth reproof is prudent.", "In the house of the righteous is much treasure: but in the revenues of the wicked is trouble.", "The lips of the wise disperse knowledge: but the heart of the foolish doth not so.", "The sacrifice of the wicked is an abomination to the LORD: but the prayer of the upright is his delight.", "The way of the wicked is an abomination unto the LORD: but he loveth him that followeth after righteousness.", "Correction is grievous unto him that forsaketh the way: and he that hateth reproof shall die.", "Hell and destruction are before the LORD: how much more then the hearts of the children of men?", "A scorner loveth not one that reproveth him: neither will he go unto the wise.", "A merry heart maketh a cheerful countenance: but by sorrow of the heart the spirit is broken.", "The heart of him that hath understanding seeketh knowledge: but the mouth of fools feedeth on foolishness.", "All the days of the afflicted are evil: but he that is of a merry heart hath a continual feast.", "Better is little with the fear of the LORD than great treasure and trouble therewith.", "Better is a dinner of herbs where love is, than a stalled ox and hatred therewith.", "A wrathful man stirreth up strife: but he that is slow to anger appeaseth strife.", "The way of the slothful man is as an hedge of thorns: but the way of the righteous is made plain.", "A wise son maketh a glad father: but a foolish man despiseth his mother.", "Folly is joy to him that is destitute of wisdom: but a man of understanding walketh uprightly.", "Without counsel purposes are disappointed: but in the multitude of counsellors they are established.", "A man hath joy by the answer of his mouth: and a word spoken in due season, how good is it!", "The way of life is above to the wise, that he may depart from hell beneath.", "The LORD will destroy the house of the proud: but he will establish the border of the widow.", "The thoughts of the wicked are an abomination to the LORD: but the words of the pure are pleasant words.", "He that is greedy of gain troubleth his own house; but he that hateth gifts shall live.", "The heart of the righteous studieth to answer: but the mouth of the wicked poureth out evil things.", "The LORD is far from the wicked: but he heareth the prayer of the righteous.", "The light of the eyes rejoiceth the heart: and a good report maketh the bones fat.", "The ear that heareth the reproof of life abideth among the wise.", "He that refuseth instruction despiseth his own soul: but he that heareth reproof getteth understanding.", "The fear of the LORD is the instruction of wisdom; and before honour is humility."],
  16: ["The preparations of the heart in man, and the answer of the tongue, is from the LORD.", "All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits.", "Commit thy works unto the LORD, and thy thoughts shall be established.", "The LORD hath made all things for himself: yea, even the wicked for the day of evil.", "Every one that is proud in heart is an abomination to the LORD: though hand join in hand, he shall not be unpunished.", "By mercy and truth iniquity is purged: and by the fear of the LORD men depart from evil.", "When a man's ways please the LORD, he maketh even his enemies to be at peace with him.", "Better is a little with righteousness than great revenues without right.", "A man's heart deviseth his way: but the LORD directeth his steps.", "A divine sentence is in the lips of the king: his mouth transgresseth not in judgment.", "A just weight and balance are the LORD'S: all the weights of the bag are his work.", "It is an abomination to kings to commit wickedness: for the throne is established by righteousness.", "Righteous lips are the delight of kings; and they love him that speaketh right.", "The wrath of a king is as messengers of death: but a wise man will pacify it.", "In the light of the king's countenance is life; and his favour is as a cloud of the latter rain.", "How much better is it to get wisdom than gold! and to get understanding rather to be chosen than silver!", "The highway of the upright is to depart from evil: he that keepeth his way preserveth his soul.", "Pride goeth before destruction, and an haughty spirit before a fall.", "Better it is to be of an humble spirit with the lowly, than to divide the spoil with the proud.", "He that handleth a matter wisely shall find good: and whoso trusteth in the LORD, happy is he.", "The wise in heart shall be called prudent: and the sweetness of the lips increaseth learning.", "Understanding is a wellspring of life unto him that hath it: but the instruction of fools is folly.", "The heart of the wise teacheth his mouth, and addeth learning to his lips.", "Pleasant words are as an honeycomb, sweet to the soul, and health to the bones.", "There is a way that seemeth right unto a man, but the end thereof are the ways of death.", "He that laboureth laboureth for himself; for his mouth craveth it of him.", "An ungodly man diggeth up evil: and in his lips there is as a burning fire.", "A froward man soweth strife: and a whisperer separateth chief friends.", "A violent man enticeth his neighbour, and leadeth him into the way that is not good.", "He shutteth his eyes to devise froward things: moving his lips he bringeth evil to pass.", "The hoary head is a crown of glory, if it be found in the way of righteousness.", "He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.", "The lot is cast into the lap; but the whole disposing thereof is of the LORD."],
  17: ["Better is a dry morsel, and quietness therewith, than an house full of sacrifices with strife.", "A wise servant shall have rule over a son that causeth shame, and shall have part of the inheritance among the brethren.", "The fining pot is for silver, and the furnace for gold: but the LORD trieth the hearts.", "A wicked doer giveth heed to false lips; and a liar giveth ear to a naughty tongue.", "Whoso mocketh the poor reproacheth his Maker: and he that is glad at calamities shall not be unpunished.", "Children's children are the crown of old men; and the glory of children are their fathers.", "Excellent speech becometh not a fool: much less do lying lips a prince.", "A gift is as a precious stone in the eyes of him that hath it: whithersoever it turneth, it prospereth.", "He that covereth a transgression seeketh love; but he that repeateth a matter separateth very friends.", "A reproof entereth more into a wise man than an hundred stripes into a fool.", "An evil man seeketh only rebellion: therefore a cruel messenger shall be sent against him.", "Let a bear robbed of her whelps meet a man, rather than a fool in his folly.", "Whoso rewardeth evil for good, evil shall not depart from his house.", "The beginning of strife is as when one letteth out water: therefore leave off contention, before it be meddled with.", "He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.", "Wherefore is there a price in the hand of a fool to get wisdom, seeing he hath no heart to it?", "A friend loveth at all times, and a brother is born for adversity.", "A man void of understanding striketh hands, and becometh surety in the presence of his friend.", "He loveth transgression that loveth strife: and he that exalteth his gate seeketh destruction.", "He that hath a froward heart findeth no good: and he that hath a perverse tongue falleth into mischief.", "He that begetteth a fool doth it to his sorrow: and the father of a fool hath no joy.", "A merry heart doeth good like a medicine: but a broken spirit drieth the bones.", "A wicked man taketh a gift out of the bosom to pervert the ways of judgment.", "Wisdom is before him that hath understanding; but the eyes of a fool are in the ends of the earth.", "A foolish son is a grief to his father, and bitterness to her that bare him.", "Also to punish the just is not good, nor to strike princes for equity.", "He that hath knowledge spareth his words: and a man of understanding is of an excellent spirit.", "Even a fool, when he holdeth his peace, is counted wise: and he that shutteth his lips is esteemed a man of understanding."],
  18: ["Through desire a man, having separated himself, seeketh and intermeddleth with all wisdom.", "A fool hath no delight in understanding, but that his heart may discover itself.", "When the wicked cometh, then cometh also contempt, and with ignominy reproach.", "The words of a man's mouth are as deep waters, and the wellspring of wisdom as a flowing brook.", "It is not good to accept the person of the wicked, to overthrow the righteous in judgment.", "A fool's lips enter into contention, and his mouth calleth for strokes.", "A fool's mouth is his destruction, and his lips are the snare of his soul.", "The words of a talebearer are as wounds, and they go down into the innermost parts of the belly.", "He also that is slothful in his work is brother to him that is a great waster.", "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.", "The rich man's wealth is his strong city, and as an high wall in his own conceit.", "Before destruction the heart of man is haughty, and before honour is humility.", "He that answereth a matter before he heareth it, it is folly and shame unto him.", "The spirit of a man will sustain his infirmity; but a wounded spirit who can bear?", "The heart of the prudent getteth knowledge; and the ear of the wise seeketh knowledge.", "A man's gift maketh room for him, and bringeth him before great men.", "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.", "The lot causeth contentions to cease, and parteth between the mighty.", "A brother offended is harder to be won than a strong city: and their contentions are like the bars of a castle.", "A man's belly shall be satisfied with the fruit of his mouth; and with the increase of his lips shall he be filled.", "Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.", "Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.", "The poor useth intreaties; but the rich answereth roughly.", "A man that hath friends must shew himself friendly: and there is a friend that sticketh closer than a brother."],
  19: ["Better is the poor that walketh in his integrity, than he that is perverse in his lips, and is a fool.", "Also, that the soul be without knowledge, it is not good; and he that hasteth with his feet sinneth.", "The foolishness of man perverteth his way: and his heart fretteth against the LORD.", "Wealth maketh many friends; but the poor is separated from his neighbour.", "A false witness shall not be unpunished, and he that speaketh lies shall not escape.", "Many will intreat the favour of the prince: and every man is a friend to him that giveth gifts.", "All the brethren of the poor do hate him: how much more do his friends go far from him? he pursueth them with words, yet they are wanting to him.", "He that getteth wisdom loveth his own soul: he that keepeth understanding shall find good.", "A false witness shall not be unpunished, and he that speaketh lies shall perish.", "Delight is not seemly for a fool; much less for a servant to have rule over princes.", "The discretion of a man deferreth his anger; and it is his glory to pass over a transgression.", "The king's wrath is as the roaring of a lion; but his favour is as dew upon the grass.", "A foolish son is the calamity of his father: and the contentions of a wife are a continual dropping.", "House and riches are the inheritance of fathers and a prudent wife is from the LORD.", "Slothfulness casteth into a deep sleep; and an idle soul shall suffer hunger.", "He that keepeth the commandment keepeth his own soul; but he that despiseth his ways shall die.", "He that hath pity upon the poor lendeth unto the LORD; and that which he hath given will he pay him again.", "Chasten thy son while there is hope, and let not thy soul spare for his crying.", "A man of great wrath shall suffer punishment: for if thou deliver him, yet thou must do it again.", "Hear counsel, and receive instruction, that thou mayest be wise in thy latter end.", "There are many devices in a man's heart; nevertheless the counsel of the LORD, that shall stand.", "The desire of a man is his kindness: and a poor man is better than a liar.", "The fear of the LORD tendeth to life: and he that hath it shall abide satisfied; he shall not be visited with evil.", "A slothful man hideth his hand in his bosom, and will not so much as bring it to his mouth again.", "Smite a scorner, and the simple will beware: and reprove one that hath understanding, and he will understand knowledge.", "He that wasteth his father, and chaseth away his mother, is a son that causeth shame, and bringeth reproach.", "Cease, my son, to hear the instruction that causeth to err from the words of knowledge.", "An ungodly witness scorneth judgment: and the mouth of the wicked devoureth iniquity.", "Judgments are prepared for scorners, and stripes for the back of fools."],
  20: ["Wine is a mocker, strong drink is raging: and whosoever is deceived thereby is not wise.", "The fear of a king is as the roaring of a lion: whoso provoketh him to anger sinneth against his own soul.", "It is an honour for a man to cease from strife: but every fool will be meddling.", "The sluggard will not plow by reason of the cold; therefore shall he beg in harvest, and have nothing.", "Counsel in the heart of man is like deep water; but a man of understanding will draw it out.", "Most men will proclaim every one his own goodness: but a faithful man who can find?", "The just man walketh in his integrity: his children are blessed after him.", "A king that sitteth in the throne of judgment scattereth away all evil with his eyes.", "Who can say, I have made my heart clean, I am pure from my sin?", "Divers weights, and divers measures, both of them are alike abomination to the LORD.", "Even a child is known by his doings, whether his work be pure, and whether it be right.", "The hearing ear, and the seeing eye, the LORD hath made even both of them.", "Love not sleep, lest thou come to poverty; open thine eyes, and thou shalt be satisfied with bread.", "It is naught, it is naught, saith the buyer: but when he is gone his way, then he boasteth.", "There is gold, and a multitude of rubies: but the lips of knowledge are a precious jewel.", "Take his garment that is surety for a stranger: and take a pledge of him for a strange woman.", "Bread of deceit is sweet to a man; but afterwards his mouth shall be filled with gravel.", "Every purpose is established by counsel: and with good advice make war.", "He that goeth about as a talebearer revealeth secrets: therefore meddle not with him that flattereth with his lips.", "Whoso curseth his father or his mother, his lamp shall be put out in obscure darkness.", "An inheritance may be gotten hastily at the beginning; but the end thereof shall not be blessed.", "Say not thou, I will recompense evil; but wait on the LORD, and he shall save thee.", "Divers weights are an abomination unto the LORD; and a false balance is not good.", "Man's goings are of the LORD; how can a man then understand his own way?", "It is a snare to the man who devoureth that which is holy, and after vows to make enquiry.", "A wise king scattereth the wicked, and bringeth the wheel over them.", "The spirit of man is the candle of the LORD, searching all the inward parts of the belly.", "Mercy and truth preserve the king: and his throne is upholden by mercy.", "The glory of young men is their strength: and the beauty of old men is the grey head.", "The blueness of a wound cleanseth away evil: so do stripes the inward parts of the belly."],
  21: ["The king's heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will.", "Every way of a man is right in his own eyes: but the LORD pondereth the hearts.", "To do justice and judgment is more acceptable to the LORD than sacrifice.", "An high look, and a proud heart, and the plowing of the wicked, is sin.", "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.", "The getting of treasures by a lying tongue is a vanity tossed to and fro of them that seek death.", "The robbery of the wicked shall destroy them; because they refuse to do judgment.", "The way of man is froward and strange: but as for the pure, his work is right.", "It is better to dwell in a corner of the housetop, than with a brawling woman in a wide house.", "The soul of the wicked desireth evil: his neighbour findeth no favour in his eyes.", "When the scorner is punished, the simple is made wise: and when the wise is instructed, he receiveth knowledge.", "The righteous man wisely considereth the house of the wicked: but God overthroweth the wicked for their wickedness.", "Whoso stoppeth his ears at the cry of the poor, he also shall cry himself, but shall not be heard.", "A gift in secret pacifieth anger: and a reward in the bosom strong wrath.", "It is joy to the just to do judgment: but destruction shall be to the workers of iniquity.", "The man that wandereth out of the way of understanding shall remain in the congregation of the dead.", "He that loveth pleasure shall be a poor man: he that loveth wine and oil shall not be rich.", "The wicked shall be a ransom for the righteous, and the transgressor for the upright.", "It is better to dwell in the wilderness, than with a contentious and an angry woman.", "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up.", "He that followeth after righteousness and mercy findeth life, righteousness, and honour.", "A wise man scaleth the city of the mighty, and casteth down the strength of the confidence thereof.", "Whoso keepeth his mouth and his tongue keepeth his soul from troubles.", "Proud and haughty scorner is his name, who dealeth in proud wrath.", "The desire of the slothful killeth him; for his hands refuse to labour.", "He coveteth greedily all the day long: but the righteous giveth and spareth not.", "The sacrifice of the wicked is abomination: how much more, when he bringeth it with a wicked mind?", "A false witness shall perish: but the man that heareth speaketh constantly.", "A wicked man hardeneth his face: but as for the upright, he directeth his way.", "There is no wisdom nor understanding nor counsel against the LORD.", "The horse is prepared against the day of battle: but safety is of the LORD."],
  22: ["A good name is rather to be chosen than great riches, and loving favour rather than silver and gold.", "The rich and poor meet together: the LORD is the maker of them all.", "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.", "By humility and the fear of the LORD are riches, and honour, and life.", "Thorns and snares are in the way of the froward: he that doth keep his soul shall be far from them.", "Train up a child in the way he should go: and when he is old, he will not depart from it.", "The rich ruleth over the poor, and the borrower is servant to the lender.", "He that soweth iniquity shall reap vanity: and the rod of his anger shall fail.", "He that hath a bountiful eye shall be blessed; for he giveth of his bread to the poor.", "Cast out the scorner, and contention shall go out; yea, strife and reproach shall cease.", "He that loveth pureness of heart, for the grace of his lips the king shall be his friend.", "The eyes of the LORD preserve knowledge, and he overthroweth the words of the transgressor.", "The slothful man saith, There is a lion without, I shall be slain in the streets.", "The mouth of strange women is a deep pit: he that is abhorred of the LORD shall fall therein.", "Foolishness is bound in the heart of a child; but the rod of correction shall drive it far from him.", "He that oppresseth the poor to increase his riches, and he that giveth to the rich, shall surely come to want.", "Bow down thine ear, and hear the words of the wise, and apply thine heart unto my knowledge.", "For it is a pleasant thing if thou keep them within thee; they shall withal be fitted in thy lips.", "That thy trust may be in the LORD, I have made known to thee this day, even to thee.", "Have not I written to thee excellent things in counsels and knowledge,", "That I might make thee know the certainty of the words of truth; that thou mightest answer the words of truth to them that send unto thee?", "Rob not the poor, because he is poor: neither oppress the afflicted in the gate:", "For the LORD will plead their cause, and spoil the soul of those that spoiled them.", "Make no friendship with an angry man; and with a furious man thou shalt not go:", "Lest thou learn his ways, and get a snare to thy soul.", "Be not thou one of them that strike hands, or of them that are sureties for debts.", "If thou hast nothing to pay, why should he take away thy bed from under thee?", "Remove not the ancient landmark, which thy fathers have set.", "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men."],
  23: ["When thou sittest to eat with a ruler, consider diligently what is before thee:", "And put a knife to thy throat, if thou be a man given to appetite.", "Be not desirous of his dainties: for they are deceitful meat.", "Labour not to be rich: cease from thine own wisdom.", "Wilt thou set thine eyes upon that which is not? for riches certainly make themselves wings; they fly away as an eagle toward heaven.", "Eat thou not the bread of him that hath an evil eye, neither desire thou his dainty meats:", "For as he thinketh in his heart, so is he: Eat and drink, saith he to thee; but his heart is not with thee.", "The morsel which thou hast eaten shalt thou vomit up, and lose thy sweet words.", "Speak not in the ears of a fool: for he will despise the wisdom of thy words.", "Remove not the old landmark; and enter not into the fields of the fatherless:", "For their redeemer is mighty; he shall plead their cause with thee.", "Apply thine heart unto instruction, and thine ears to the words of knowledge.", "Withhold not correction from the child: for if thou beatest him with the rod, he shall not die.", "Thou shalt beat him with the rod, and shalt deliver his soul from hell.", "My son, if thine heart be wise, my heart shall rejoice, even mine.", "Yea, my reins shall rejoice, when thy lips speak right things.", "Let not thine heart envy sinners: but be thou in the fear of the LORD all the day long.", "For surely there is an end; and thine expectation shall not be cut off.", "Hear thou, my son, and be wise, and guide thine heart in the way.", "Be not among winebibbers; among riotous eaters of flesh:", "For the drunkard and the glutton shall come to poverty: and drowsiness shall clothe a man with rags.", "Hearken unto thy father that begat thee, and despise not thy mother when she is old.", "Buy the truth, and sell it not; also wisdom, and instruction, and understanding.", "The father of the righteous shall greatly rejoice: and he that begetteth a wise child shall have joy of him.", "Thy father and thy mother shall be glad, and she that bare thee shall rejoice.", "My son, give me thine heart, and let thine eyes observe my ways.", "For a whore is a deep ditch; and a strange woman is a narrow pit.", "She also lieth in wait as for a prey, and increaseth the transgressors among men.", "Who hath woe? who hath sorrow? who hath contentions? who hath babbling? who hath wounds without cause? who hath redness of eyes?", "They that tarry long at the wine; they that go to seek mixed wine.", "Look not thou upon the wine when it is red, when it giveth his colour in the cup, when it moveth itself aright.", "At the last it biteth like a serpent, and stingeth like an adder.", "Thine eyes shall behold strange women, and thine heart shall utter perverse things.", "Yea, thou shalt be as he that lieth down in the midst of the sea, or as he that lieth upon the top of a mast.", "They have stricken me, shalt thou say, and I was not sick; they have beaten me, and I felt it not: when shall I awake? I will seek it yet again."],
  24: ["Be not thou envious against evil men, neither desire to be with them.", "For their heart studieth destruction, and their lips talk of mischief.", "Through wisdom is an house builded; and by understanding it is established:", "And by knowledge shall the chambers be filled with all precious and pleasant riches.", "A wise man is strong; yea, a man of knowledge increaseth strength.", "For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.", "Wisdom is too high for a fool: he openeth not his mouth in the gate.", "He that deviseth to do evil shall be called a mischievous person.", "The thought of foolishness is sin: and the scorner is an abomination to men.", "If thou faint in the day of adversity, thy strength is small.", "If thou forbear to deliver them that are drawn unto death, and those that are ready to be slain;", "If thou sayest, Behold, we knew it not; doth not he that pondereth the heart consider it?", "My son, eat thou honey, because it is good; and the honeycomb, which is sweet to thy taste:", "So shall the knowledge of wisdom be unto thy soul: when thou hast found it, then there shall be a reward.", "Lay not wait, O wicked man, against the dwelling of the righteous; spoil not his resting place:", "For a just man falleth seven times, and riseth up again: but the wicked shall fall into mischief.", "Rejoice not when thine enemy falleth, and let not thine heart be glad when he stumbleth:", "Lest the LORD see it, and it displease him, and he turn away his wrath from him.", "Fret not thyself because of evil men, neither be thou envious at the wicked;", "For there shall be no reward to the evil man; the candle of the wicked shall be put out.", "My son, fear thou the LORD and the king: and meddle not with them that are given to change:", "For their calamity shall rise suddenly; and who knoweth the ruin of them both?", "These things also belong to the wise. It is not good to have respect of persons in judgment.", "He that saith unto the wicked, Thou art righteous; him shall the people curse, nations shall abhor him:", "But to them that rebuke him shall be delight, and a good blessing shall come upon them.", "Every man shall kiss his lips that giveth a right answer.", "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.", "Be not a witness against thy neighbour without cause; and deceive not with thy lips.", "Say not, I will do so to him as he hath done to me: I will render to the man according to his work.", "I went by the field of the slothful, and by the vineyard of the man void of understanding;", "And, lo, it was all grown over with thorns, and nettles had covered the face thereof, and the stone wall thereof was broken down.", "Then I saw, and considered it well: I looked upon it, and received instruction.", "Yet a little sleep, a little slumber, a little folding of the hands to sleep:", "So shall thy poverty come as one that travelleth; and thy want as an armed man."],
  25: ["These are also proverbs of Solomon, which the men of Hezekiah king of Judah copied out.", "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.", "The heaven for height, and the earth for depth, and the heart of kings is unsearchable.", "Take away the dross from the silver, and there shall come forth a vessel for the finer.", "Take away the wicked from before the king, and his throne shall be established in righteousness.", "Put not forth thyself in the presence of the king, and stand not in the place of great men:", "For better it is that it be said unto thee, Come up hither; than that thou shouldest be put lower in the presence of the prince whom thine eyes have seen.", "Go not forth hastily to strive, lest thou know not what to do in the end thereof, when thy neighbour hath put thee to shame.", "Debate thy cause with thy neighbour himself; and discover not a secret to another:", "Lest he that heareth it put thee to shame, and thine infamy turn not away.", "A word fitly spoken is like apples of gold in pictures of silver.", "As an earring of gold, and an ornament of fine gold, so is a wise reprover upon an obedient ear.", "As the cold of snow in the time of harvest, so is a faithful messenger to them that send him: for he refresheth the soul of his masters.", "Whoso boasteth himself of a false gift is like clouds and wind without rain.", "By long forbearing is a prince persuaded, and a soft tongue breaketh the bone.", "Hast thou found honey? eat so much as is sufficient for thee, lest thou be filled therewith, and vomit it.", "Withdraw thy foot from thy neighbour's house; lest he be weary of thee, and so hate thee.", "A man that beareth false witness against his neighbour is a maul, and a sword, and a sharp arrow.", "Confidence in an unfaithful man in time of trouble is like a broken tooth, and a foot out of joint.", "As he that taketh away a garment in cold weather, and as vinegar upon nitre, so is he that singeth songs to an heavy heart.", "If thine enemy be hungry, give him bread to eat; and if he be thirsty, give him water to drink:", "For thou shalt heap coals of fire upon his head, and the LORD shall reward thee.", "The north wind driveth away rain: so doth an angry countenance a backbiting tongue.", "It is better to dwell in the corner of the housetop, than with a brawling woman and in a wide house.", "As cold waters to a thirsty soul, so is good news from a far country.", "A righteous man falling down before the wicked is as a troubled fountain, and a corrupt spring.", "It is not good to eat much honey: so for men to search their own glory is not glory.", "He that hath no rule over his own spirit is like a city that is broken down, and without walls."],
  26: ["As snow in summer, and as rain in harvest, so honour is not seemly for a fool.", "As the bird by wandering, as the swallow by flying, so the curse causeless shall not come.", "A whip for the horse, a bridle for the ass, and a rod for the fool's back.", "Answer not a fool according to his folly, lest thou also be like unto him.", "Answer a fool according to his folly, lest he be wise in his own conceit.", "He that sendeth a message by the hand of a fool cutteth off the feet, and drinketh damage.", "The legs of the lame are not equal: so is a parable in the mouth of fools.", "As he that bindeth a stone in a sling, so is he that giveth honour to a fool.", "As a thorn goeth up into the hand of a drunkard, so is a parable in the mouth of fools.", "The great God that formed all things both rewardeth the fool, and rewardeth transgressors.", "As a dog returneth to his vomit, so a fool returneth to his folly.", "Seest thou a man wise in his own conceit? there is more hope of a fool than of him.", "The slothful man saith, There is a lion in the way; a lion is in the streets.", "As the door turneth upon his hinges, so doth the slothful upon his bed.", "The slothful hideth his hand in his bosom; it grieveth him to bring it again to his mouth.", "The sluggard is wiser in his own conceit than seven men that can render a reason.", "He that passeth by, and meddleth with strife belonging not to him, is like one that taketh a dog by the ears.", "As a mad man who casteth firebrands, arrows, and death,", "So is the man that deceiveth his neighbour, and saith, Am not I in sport?", "Where no wood is, there the fire goeth out: so where there is no talebearer, the strife ceaseth.", "As coals are to burning coals, and wood to fire; so is a contentious man to kindle strife.", "The words of a talebearer are as wounds, and they go down into the innermost parts of the belly.", "Burning lips and a wicked heart are like a potsherd covered with silver dross.", "He that hateth dissembleth with his lips, and layeth up deceit within him;", "When he speaketh fair, believe him not: for there are seven abominations in his heart.", "Whose hatred is covered by deceit, his wickedness shall be shewed before the whole congregation.", "Whoso diggeth a pit shall fall therein: and he that rolleth a stone, it will return upon him.", "A lying tongue hateth those that are afflicted by it; and a flattering mouth worketh ruin."],
  27: ["Boast not thyself of to morrow; for thou knowest not what a day may bring forth.", "Let another man praise thee, and not thine own mouth; a stranger, and not thine own lips.", "A stone is heavy, and the sand weighty; but a fool's wrath is heavier than them both.", "Wrath is cruel, and anger is outrageous; but who is able to stand before envy?", "Open rebuke is better than secret love.", "Faithful are the wounds of a friend; but the kisses of an enemy are deceitful.", "The full soul loatheth an honeycomb; but to the hungry soul every bitter thing is sweet.", "As a bird that wandereth from her nest, so is a man that wandereth from his place.", "Ointment and perfume rejoice the heart: so doth the sweetness of a man's friend by hearty counsel.", "Thine own friend, and thy father's friend, forsake not; neither go into thy brother's house in the day of thy calamity: for better is a neighbour that is near than a brother far off.", "My son, be wise, and make my heart glad, that I may answer him that reproacheth me.", "A prudent man foreseeth the evil, and hideth himself; but the simple pass on, and are punished.", "Take his garment that is surety for a stranger, and take a pledge of him for a strange woman.", "He that blesseth his friend with a loud voice, rising early in the morning, it shall be counted a curse to him.", "A continual dropping in a very rainy day and a contentious woman are alike.", "Whosoever hideth her hideth the wind, and the ointment of his right hand, which bewrayeth itself.", "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.", "Whoso keepeth the fig tree shall eat the fruit thereof: so he that waiteth on his master shall be honoured.", "As in water face answereth to face, so the heart of man to man.", "Hell and destruction are never full; so the eyes of man are never satisfied.", "As the fining pot for silver, and the furnace for gold; so is a man to his praise.", "Though thou shouldest bray a fool in a mortar among wheat with a pestle, yet will not his foolishness depart from him.", "Be thou diligent to know the state of thy flocks, and look well to thy herds.", "For riches are not for ever: and doth the crown endure to every generation?", "The hay appeareth, and the tender grass sheweth itself, and herbs of the mountains are gathered.", "The lambs are for thy clothing, and the goats are the price of the field.", "And thou shalt have goats' milk enough for thy food, for the food of thy household, and for the maintenance for thy maidens."],
  28: ["The wicked flee when no man pursueth: but the righteous are bold as a lion.", "For the transgression of a land many are the princes thereof: but by a man of understanding and knowledge the state thereof shall be prolonged.", "A poor man that oppresseth the poor is like a sweeping rain which leaveth no food.", "They that forsake the law praise the wicked: but such as keep the law contend with them.", "Evil men understand not judgment: but they that seek the LORD understand all things.", "Better is the poor that walketh in his uprightness, than he that is perverse in his ways, though he be rich.", "Whoso keepeth the law is a wise son: but he that is a companion of riotous men shameth his father.", "He that by usury and unjust gain increaseth his substance, he shall gather it for him that will pity the poor.", "He that turneth away his ear from hearing the law, even his prayer shall be abomination.", "Whoso causeth the righteous to go astray in an evil way, he shall fall himself into his own pit: but the upright shall have good things in possession.", "The rich man is wise in his own conceit; but the poor that hath understanding searcheth him out.", "When righteous men do rejoice, there is great glory: but when the wicked rise, a man is hidden.", "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.", "Happy is the man that feareth alway: but he that hardeneth his heart shall fall into mischief.", "As a roaring lion, and a ranging bear; so is a wicked ruler over the poor people.", "The prince that wanteth understanding is also a great oppressor: but he that hateth covetousness shall prolong his days.", "A man that doeth violence to the blood of any person shall flee to the pit; let no man stay him.", "Whoso walketh uprightly shall be saved: but he that is perverse in his ways shall fall at once.", "He that tilleth his land shall have plenty of bread: but he that followeth after vain persons shall have poverty enough.", "A faithful man shall abound with blessings: but he that maketh haste to be rich shall not be innocent.", "To have respect of persons is not good: for for a piece of bread that man will transgress.", "He that hasteth to be rich hath an evil eye, and considereth not that poverty shall come upon him.", "He that rebuketh a man afterwards shall find more favour than he that flattereth with the tongue.", "Whoso robbeth his father or his mother, and saith, It is no transgression; the same is the companion of a destroyer.", "He that is of a proud heart stirreth up strife: but he that putteth his trust in the LORD shall be made fat.", "He that trusteth in his own heart is a fool: but whoso walketh wisely, he shall be delivered.", "He that giveth unto the poor shall not lack: but he that hideth his eyes shall have many a curse.", "When the wicked rise, men hide themselves: but when they perish, the righteous increase."],
  29: ["He, that being often reproved hardeneth his neck, shall suddenly be destroyed, and that without remedy.", "When the righteous are in authority, the people rejoice: but when the wicked beareth rule, the people mourn.", "Whoso loveth wisdom rejoiceth his father: but he that keepeth company with harlots spendeth his substance.", "The king by judgment establisheth the land: but he that receiveth gifts overthroweth it.", "A man that flattereth his neighbour spreadeth a net for his feet.", "In the transgression of an evil man there is a snare: but the righteous doth sing and rejoice.", "The righteous considereth the cause of the poor: but the wicked regardeth not to know it.", "Scornful men bring a city into a snare: but wise men turn away wrath.", "If a wise man contendeth with a foolish man, whether he rage or laugh, there is no rest.", "The bloodthirsty hate the upright: but the just seek his soul.", "A fool uttereth all his mind: but a wise man keepeth it in till afterwards.", "If a ruler hearken to lies, all his servants are wicked.", "The poor and the deceitful man meet together: the LORD lighteneth both their eyes.", "The king that faithfully judgeth the poor, his throne shall be established for ever.", "The rod and reproof give wisdom: but a child left to himself bringeth his mother to shame.", "When the wicked are multiplied, transgression increaseth: but the righteous shall see their fall.", "Correct thy son, and he shall give thee rest; yea, he shall give delight unto thy soul.", "Where there is no vision, the people perish: but he that keepeth the law, happy is he.", "A servant will not be corrected by words: for though he understand he will not answer.", "Seest thou a man that is hasty in his words? there is more hope of a fool than of him.", "He that delicately bringeth up his servant from a child shall have him become his son at the length.", "An angry man stirreth up strife, and a furious man aboundeth in transgression.", "A man's pride shall bring him low: but honour shall uphold the humble in spirit.", "Whoso is partner with a thief hateth his own soul: he heareth cursing, and bewrayeth it not.", "The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.", "Many seek the ruler's favour; but every man's judgment cometh from the LORD.", "An unjust man is an abomination to the just: and he that is upright in the way is abomination to the wicked."],
  30: ["The words of Agur the son of Jakeh, even the prophecy: the man spake unto Ithiel, even unto Ithiel and Ucal,", "Surely I am more brutish than any man, and have not the understanding of a man.", "I neither learned wisdom, nor have the knowledge of the holy.", "Who hath ascended up into heaven, or descended? who hath gathered the wind in his fists? who hath bound the waters in a garment? who hath established all the ends of the earth? what is his name, and what is his son's name, if thou canst tell?", "Every word of God is pure: he is a shield unto them that put their trust in him.", "Add thou not unto his words, lest he reprove thee, and thou be found a liar.", "Two things have I required of thee; deny me them not before I die:", "Remove far from me vanity and lies: give me neither poverty nor riches; feed me with food convenient for me:", "Lest I be full, and deny thee, and say, Who is the LORD? or lest I be poor, and steal, and take the name of my God in vain.", "Accuse not a servant unto his master, lest he curse thee, and thou be found guilty.", "There is a generation that curseth their father, and doth not bless their mother.", "There is a generation that are pure in their own eyes, and yet is not washed from their filthiness.", "There is a generation, O how lofty are their eyes! and their eyelids are lifted up.", "There is a generation, whose teeth are as swords, and their jaw teeth as knives, to devour the poor from off the earth, and the needy from among men.", "The horseleach hath two daughters, crying, Give, give. There are three things that are never satisfied, yea, four things say not, It is enough:", "The grave; and the barren womb; the earth that is not filled with water; and the fire that saith not, It is enough.", "The eye that mocketh at his father, and despiseth to obey his mother, the ravens of the valley shall pick it out, and the young eagles shall eat it.", "There be three things which are too wonderful for me, yea, four which I know not:", "The way of an eagle in the air; the way of a serpent upon a rock; the way of a ship in the midst of the sea; and the way of a man with a maid.", "Such is the way of an adulterous woman; she eateth, and wipeth her mouth, and saith, I have done no wickedness.", "For three things the earth is disquieted, and for four which it cannot bear:", "For a servant when he reigneth; and a fool when he is filled with meat;", "For an odious woman when she is married; and an handmaid that is heir to her mistress.", "There be four things which are little upon the earth, but they are exceeding wise:", "The ants are a people not strong, yet they prepare their meat in the summer;", "The conies are but a feeble folk, yet make they their houses in the rocks;", "The locusts have no king, yet go they forth all of them by bands;", "The spider taketh hold with her hands, and is in kings' palaces.", "There be three things which go well, yea, four are comely in going:", "A lion which is strongest among beasts, and turneth not away for any;", "A greyhound; an he goat also; and a king, against whom there is no rising up.", "If thou hast done foolishly in lifting up thyself, or if thou hast thought evil, lay thine hand upon thy mouth.", "Surely the churning of milk bringeth forth butter, and the wringing of the nose bringeth forth blood: so the forcing of wrath bringeth forth strife."],
  31: ["The words of king Lemuel, the prophecy that his mother taught him.", "What, my son? and what, the son of my womb? and what, the son of my vows?", "Give not thy strength unto women, nor thy ways to that which destroyeth kings.", "It is not for kings, O Lemuel, it is not for kings to drink wine; nor for princes strong drink:", "Lest they drink, and forget the law, and pervert the judgment of any of the afflicted.", "Give strong drink unto him that is ready to perish, and wine unto those that be of heavy hearts.", "Let him drink, and forget his poverty, and remember his misery no more.", "Open thy mouth for the dumb in the cause of all such as are appointed to destruction.", "Open thy mouth, judge righteously, and plead the cause of the poor and needy.", "Who can find a virtuous woman? for her price is far above rubies.", "The heart of her husband doth safely trust in her, so that he shall have no need of spoil.", "She will do him good and not evil all the days of her life.", "She seeketh wool, and flax, and worketh willingly with her hands.", "She is like the merchants' ships; she bringeth her food from afar.", "She riseth also while it is yet night, and giveth meat to her household, and a portion to her maidens.", "She considereth a field, and buyeth it: with the fruit of her hands she planteth a vineyard.", "She girdeth her loins with strength, and strengtheneth her arms.", "She perceiveth that her merchandise is good: her candle goeth not out by night.", "She layeth her hands to the spindle, and her hands hold the distaff.", "She stretcheth out her hand to the poor; yea, she reacheth forth her hands to the needy.", "She is not afraid of the snow for her household: for all her household are clothed with scarlet.", "She maketh herself coverings of tapestry; her clothing is silk and purple.", "Her husband is known in the gates, when he sitteth among the elders of the land.", "She maketh fine linen, and selleth it; and delivereth girdles unto the merchant.", "Strength and honour are her clothing; and she shall rejoice in time to come.", "She openeth her mouth with wisdom; and in her tongue is the law of kindness.", "She looketh well to the ways of her household, and eateth not the bread of idleness.", "Her children arise up, and call her blessed; her husband also, and he praiseth her.", "Many daughters have done virtuously, but thou excellest them all.", "Favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised.", "Give her of the fruit of her hands; and let her own works praise her in the gates."]
};

const generate91DayProverbsPlan = (cycleNumber = 1) => {
  const plan = [];

  // 91-day Proverbs reading plan covering chapters 1-27
  // Each entry represents one day's reading (~10 verses)
  const readingPlan = [
    // Days 1-4: Proverbs 1 (33 verses)
    { day: 1, chapter: 1, startVerse: 1, endVerse: 10 },
    { day: 2, chapter: 1, startVerse: 11, endVerse: 20 },
    { day: 3, chapter: 1, startVerse: 21, endVerse: 30 },
    { day: 4, chapter: 1, startVerse: 31, endVerse: 33 },

    // Days 5-6: Proverbs 2 (22 verses)
    { day: 5, chapter: 2, startVerse: 1, endVerse: 11 },
    { day: 6, chapter: 2, startVerse: 12, endVerse: 22 },

    // Days 7-10: Proverbs 3 (35 verses)
    { day: 7, chapter: 3, startVerse: 1, endVerse: 10 },
    { day: 8, chapter: 3, startVerse: 11, endVerse: 20 },
    { day: 9, chapter: 3, startVerse: 21, endVerse: 30 },
    { day: 10, chapter: 3, startVerse: 31, endVerse: 35 },

    // Days 11-13: Proverbs 4 (27 verses)
    { day: 11, chapter: 4, startVerse: 1, endVerse: 10 },
    { day: 12, chapter: 4, startVerse: 11, endVerse: 20 },
    { day: 13, chapter: 4, startVerse: 21, endVerse: 27 },

    // Days 14-16: Proverbs 5 (23 verses)
    { day: 14, chapter: 5, startVerse: 1, endVerse: 10 },
    { day: 15, chapter: 5, startVerse: 11, endVerse: 20 },
    { day: 16, chapter: 5, startVerse: 21, endVerse: 23 },

    // Days 17-20: Proverbs 6 (35 verses)
    { day: 17, chapter: 6, startVerse: 1, endVerse: 10 },
    { day: 18, chapter: 6, startVerse: 11, endVerse: 20 },
    { day: 19, chapter: 6, startVerse: 21, endVerse: 30 },
    { day: 20, chapter: 6, startVerse: 31, endVerse: 35 },

    // Days 21-23: Proverbs 7 (27 verses)
    { day: 21, chapter: 7, startVerse: 1, endVerse: 10 },
    { day: 22, chapter: 7, startVerse: 11, endVerse: 20 },
    { day: 23, chapter: 7, startVerse: 21, endVerse: 27 },

    // Days 24-27: Proverbs 8 (36 verses)
    { day: 24, chapter: 8, startVerse: 1, endVerse: 10 },
    { day: 25, chapter: 8, startVerse: 11, endVerse: 20 },
    { day: 26, chapter: 8, startVerse: 21, endVerse: 30 },
    { day: 27, chapter: 8, startVerse: 31, endVerse: 36 },

    // Days 28-29: Proverbs 9 (18 verses)
    { day: 28, chapter: 9, startVerse: 1, endVerse: 10 },
    { day: 29, chapter: 9, startVerse: 11, endVerse: 18 },

    // Days 30-33: Proverbs 10 (32 verses)
    { day: 30, chapter: 10, startVerse: 1, endVerse: 10 },
    { day: 31, chapter: 10, startVerse: 11, endVerse: 20 },
    { day: 32, chapter: 10, startVerse: 21, endVerse: 30 },
    { day: 33, chapter: 10, startVerse: 31, endVerse: 32 },

    // Days 34-37: Proverbs 11 (31 verses)
    { day: 34, chapter: 11, startVerse: 1, endVerse: 10 },
    { day: 35, chapter: 11, startVerse: 11, endVerse: 20 },
    { day: 36, chapter: 11, startVerse: 21, endVerse: 30 },
    { day: 37, chapter: 11, startVerse: 31, endVerse: 31 },

    // Days 38-40: Proverbs 12 (28 verses)
    { day: 38, chapter: 12, startVerse: 1, endVerse: 10 },
    { day: 39, chapter: 12, startVerse: 11, endVerse: 20 },
    { day: 40, chapter: 12, startVerse: 21, endVerse: 28 },

    // Days 41-43: Proverbs 13 (25 verses)
    { day: 41, chapter: 13, startVerse: 1, endVerse: 10 },
    { day: 42, chapter: 13, startVerse: 11, endVerse: 20 },
    { day: 43, chapter: 13, startVerse: 21, endVerse: 25 },

    // Days 44-47: Proverbs 14 (35 verses)
    { day: 44, chapter: 14, startVerse: 1, endVerse: 10 },
    { day: 45, chapter: 14, startVerse: 11, endVerse: 20 },
    { day: 46, chapter: 14, startVerse: 21, endVerse: 30 },
    { day: 47, chapter: 14, startVerse: 31, endVerse: 35 },

    // Days 48-51: Proverbs 15 (33 verses)
    { day: 48, chapter: 15, startVerse: 1, endVerse: 10 },
    { day: 49, chapter: 15, startVerse: 11, endVerse: 20 },
    { day: 50, chapter: 15, startVerse: 21, endVerse: 30 },
    { day: 51, chapter: 15, startVerse: 31, endVerse: 33 },

    // Days 52-55: Proverbs 16 (33 verses)
    { day: 52, chapter: 16, startVerse: 1, endVerse: 10 },
    { day: 53, chapter: 16, startVerse: 11, endVerse: 20 },
    { day: 54, chapter: 16, startVerse: 21, endVerse: 30 },
    { day: 55, chapter: 16, startVerse: 31, endVerse: 33 },

    // Days 56-58: Proverbs 17 (28 verses)
    { day: 56, chapter: 17, startVerse: 1, endVerse: 10 },
    { day: 57, chapter: 17, startVerse: 11, endVerse: 20 },
    { day: 58, chapter: 17, startVerse: 21, endVerse: 28 },

    // Days 59-61: Proverbs 18 (24 verses)
    { day: 59, chapter: 18, startVerse: 1, endVerse: 10 },
    { day: 60, chapter: 18, startVerse: 11, endVerse: 20 },
    { day: 61, chapter: 18, startVerse: 21, endVerse: 24 },

    // Days 62-64: Proverbs 19 (29 verses)
    { day: 62, chapter: 19, startVerse: 1, endVerse: 10 },
    { day: 63, chapter: 19, startVerse: 11, endVerse: 20 },
    { day: 64, chapter: 19, startVerse: 21, endVerse: 29 },

    // Days 65-67: Proverbs 20 (30 verses)
    { day: 65, chapter: 20, startVerse: 1, endVerse: 10 },
    { day: 66, chapter: 20, startVerse: 11, endVerse: 20 },
    { day: 67, chapter: 20, startVerse: 21, endVerse: 30 },

    // Days 68-71: Proverbs 21 (31 verses)
    { day: 68, chapter: 21, startVerse: 1, endVerse: 10 },
    { day: 69, chapter: 21, startVerse: 11, endVerse: 20 },
    { day: 70, chapter: 21, startVerse: 21, endVerse: 30 },
    { day: 71, chapter: 21, startVerse: 31, endVerse: 31 },

    // Days 72-74: Proverbs 22 (29 verses)
    { day: 72, chapter: 22, startVerse: 1, endVerse: 10 },
    { day: 73, chapter: 22, startVerse: 11, endVerse: 20 },
    { day: 74, chapter: 22, startVerse: 21, endVerse: 29 },

    // Days 75-78: Proverbs 23 (35 verses)
    { day: 75, chapter: 23, startVerse: 1, endVerse: 10 },
    { day: 76, chapter: 23, startVerse: 11, endVerse: 20 },
    { day: 77, chapter: 23, startVerse: 21, endVerse: 30 },
    { day: 78, chapter: 23, startVerse: 31, endVerse: 35 },

    // Days 79-82: Proverbs 24 (34 verses)
    { day: 79, chapter: 24, startVerse: 1, endVerse: 10 },
    { day: 80, chapter: 24, startVerse: 11, endVerse: 20 },
    { day: 81, chapter: 24, startVerse: 21, endVerse: 30 },
    { day: 82, chapter: 24, startVerse: 31, endVerse: 34 },

    // Days 83-85: Proverbs 25 (28 verses)
    { day: 83, chapter: 25, startVerse: 1, endVerse: 10 },
    { day: 84, chapter: 25, startVerse: 11, endVerse: 20 },
    { day: 85, chapter: 25, startVerse: 21, endVerse: 28 },

    // Days 86-88: Proverbs 26 (28 verses)
    { day: 86, chapter: 26, startVerse: 1, endVerse: 10 },
    { day: 87, chapter: 26, startVerse: 11, endVerse: 20 },
    { day: 88, chapter: 26, startVerse: 21, endVerse: 28 },

    // Days 89-91: Proverbs 27 (27 verses)
    { day: 89, chapter: 27, startVerse: 1, endVerse: 10 },
    { day: 90, chapter: 27, startVerse: 11, endVerse: 20 },
    { day: 91, chapter: 27, startVerse: 21, endVerse: 27 }

    // Note: Chapters 28-31 are available in proverbsKJV but not in the 91-day cycle
  ];

  readingPlan.forEach((entry) => {
    // Get the actual verse text from the chapter if available
    let verseText = '';
    if (proverbsKJV[entry.chapter]) {
      const verses = proverbsKJV[entry.chapter];
      const selectedVerses = verses.slice(entry.startVerse - 1, entry.endVerse);
      verseText = selectedVerses.join(' ');
    } else {
      verseText = `[Proverbs ${entry.chapter}:${entry.startVerse}-${entry.endVerse} - KJV verses to be loaded]`;
    }

    plan.push({
      id: `listening-cycle${cycleNumber}-day${entry.day}`,
      cycle_number: cycleNumber,
      day_number: entry.day,
      chapter: entry.chapter,
      start_verse: entry.startVerse,
      end_verse: entry.endVerse,
      title: `Proverbs ${entry.chapter}:${entry.startVerse}-${entry.endVerse}`,
      category: 'Listening Prayer',
      reference_text: verseText,
      audio_url: null,
      created_at: new Date().toISOString()
    });
  });

  return plan;
};

// ============================================
// 4. COMBINED PRAYER LIBRARY
// ============================================

export const initializePrayerLibrary = () => {
  console.log('🙏 Initializing Prayer Library in localStorage...');

  // Combine all Kingdom Focus prayers
  const allKingdomFocusPrayers = [
    june30Prayer,
    ...kingdomFocusPrayers,
    ...novemberDecemberPrayers
  ];

  // Generate Proverbs Cycle 1
  const listeningPrayers = generate91DayProverbsPlan(1);

  // Flatten intercession points for Lovable's schema
  const flattenedPrayers = [];

  // Kingdom Focus prayers (each intercession becomes a separate row)
  allKingdomFocusPrayers.forEach((prayer: any) => {
    prayer.intercession_points.forEach((point: string, index: number) => {
      flattenedPrayers.push({
        id: `${prayer.id}-i${index + 1}`,
        month: prayer.month,
        day: prayer.day,
        day_of_week: prayer.day_of_week,
        title: `${prayer.month} ${prayer.day} - Intercession ${index + 1}`,
        content: point,
        category: prayer.category,
        intercession_number: index + 1,
        is_placeholder: prayer.is_placeholder || false,
        audio_url: null,
        created_at: prayer.created_at
      });
    });
  });

  // Listening prayers
  listeningPrayers.forEach(prayer => {
    flattenedPrayers.push({
      id: prayer.id,
      cycle_number: prayer.cycle_number,
      day_number: prayer.day_number,
      chapter: prayer.chapter,
      start_verse: prayer.start_verse,
      end_verse: prayer.end_verse,
      title: prayer.title,
      content: prayer.reference_text,
      category: prayer.category,
      audio_url: prayer.audio_url,
      created_at: prayer.created_at
    });
  });

  // Store in localStorage
  localStorage.setItem('prayerjourney_prayer_points', JSON.stringify(flattenedPrayers));

  const stats = {
    kingdomFocus: allKingdomFocusPrayers.length * 4, // 4 intercessions each
    listening: listeningPrayers.length,
    total: flattenedPrayers.length
  };

  console.log(`✅ Stored ${stats.kingdomFocus} Kingdom Focused intercessions`);
  console.log(`✅ Stored ${stats.listening} Listening Prayer entries`);
  console.log(`✅ Total: ${stats.total} prayer library items`);
  console.log(`📅 Date range: June 30 - December 31, 2025`);

  return stats;
};

// ============================================
// 5. CHECK INITIALIZATION STATUS
// ============================================

export const checkPrayerLibraryStatus = () => {
  const stored = localStorage.getItem('prayerjourney_prayer_points');

  if (!stored) {
    return {
      initialized: false,
      message: '⚠️ Prayer library not initialized. Call initializePrayerLibrary().'
    };
  }

  const prayers = JSON.parse(stored);
  const kingdomCount = prayers.filter((p: any) => p.category === 'Kingdom Focused').length;
  const listeningCount = prayers.filter((p: any) => p.category === 'Listening Prayer').length;

  return {
    initialized: true,
    total: prayers.length,
    kingdomFocus: kingdomCount,
    listening: listeningCount,
    message: `✅ Prayer library loaded: ${kingdomCount} Kingdom Focused + ${listeningCount} Listening`
  };
};

// ============================================
// 6. AUTO-INITIALIZE ON FIRST APP LOAD (FORCE OVERWRITE)
// ============================================

export const ensurePrayerLibraryInitialized = () => {
  // ALWAYS initialize to replace old mock data with real prayers
  console.log('🚀 Initializing prayer library with real client data...');
  return initializePrayerLibrary();
};
