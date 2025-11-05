-- ============================================
-- PRAYER LIBRARY DATA MIGRATION
-- This script populates prayer_library table with:
-- 1. Kingdom Focus prayers (June 30 - December 31, 2025)
-- 2. Listening Prayers (91-day Proverbs cycle)
-- ============================================

-- June 30 (Monday) - START
INSERT INTO prayer_library (title, content, category, month, day, year, day_of_week, intercession_number) VALUES
('June 30 Intercession 1', 'Father, thank You for the holy invasion of great and abiding multitudes into our Service(s) yesterday, and for placing Your touch-not seal upon every worshipper by Your Word – Psa. 118:23', 'Kingdom Focus', 'June', 30, 2025, 'Monday', 1),
('June 30 Intercession 2', 'Father, we destroy all satanic strongholds against the salvation of all that are ordained unto eternal life across our harvest field as we take the territories for Christ – Act. 13:48', 'Kingdom Focus', 'June', 30, 2025, 'Monday', 2),
('June 30 Intercession 3', 'Father, continue to make this church a spiritually watered garden where every worshipper is well-nourished by Your Word – Isa. 58:11', 'Kingdom Focus', 'June', 30, 2025, 'Monday', 3),
('June 30 Intercession 4', 'Father, open the eyes of all our first timers and new converts to see this church as their God-appointed city of refuge, so they can abide here for life – 2 Sam. 7:10', 'Kingdom Focus', 'June', 30, 2025, 'Monday', 4);

-- July Prayers
INSERT INTO prayer_library (title, content, category, month, day, year, day_of_week, intercession_number) VALUES
-- July 1
('July 1 Intercession 1', 'Father, thank You for Your manifest presence in our midst all through the first half of 2025, both as a Commission and as individuals, which has resulted in diverse blessings upon our lives – Psa. 103:1-2', 'Kingdom Focus', 'July', 1, 2025, 'Tuesday', 1),
('July 1 Intercession 2', 'Father, we decree the rescue of every captive of hell unto salvation across our harvest field this week as Operation-By-All-Means kicks off today – Zech. 9:11-12', 'Kingdom Focus', 'July', 1, 2025, 'Tuesday', 2),
('July 1 Intercession 3', 'Lord Jesus, trigger new waves of signs and wonders by Your Word in our services all through Operation-By-All-Means and beyond, thereby drafting multitudes into the Kingdom and this church – Act. 5:12/14', 'Kingdom Focus', 'July', 1, 2025, 'Tuesday', 3),
('July 1 Intercession 4', 'Father, let this church be minimum double her current attendance before this Midst of the Year Season of Glory concludes – Jer. 30:19', 'Kingdom Focus', 'July', 1, 2025, 'Tuesday', 4),
-- July 2
('July 2 Intercession 1', 'Father, we destroy the gates of hell that may resist the New Era order of explosive growth ordained for all our churches across the globe all through Operation-By-All-Means and beyond – Matt. 16:18', 'Kingdom Focus', 'July', 2, 2025, 'Wednesday', 1),
('July 2 Intercession 2', 'Father, supernaturally meet the needs of all our new converts and members in this Midst of the Year Season of Glory and beyond, so they can settle down in this church, take root downwards and bear fruits upwards – Isa. 37:31', 'Kingdom Focus', 'July', 2, 2025, 'Wednesday', 2),
('July 2 Intercession 3', 'Father, in the name of Jesus, this week, ignite the zeal of Your house in the heart of every Winner towards the full delivery of Operation-By-All-Means – Hag. 1:14', 'Kingdom Focus', 'July', 2, 2025, 'Wednesday', 3),
('July 2 Intercession 4', 'Father, continue to visit our Winners Satellite Fellowship operations with grace for supernatural growth and replication all through Operation-By-All-Means and beyond – Act. 5:42', 'Kingdom Focus', 'July', 2, 2025, 'Wednesday', 4);

-- Note: Due to file size limitations, the complete 700+ prayer entries will be added via the edge function
-- This is a sample showing the structure. The actual migration will use the populate-prayer-library edge function

-- ============================================
-- 91-DAY PROVERBS LISTENING PRAYER PLAN
-- ============================================
INSERT INTO prayer_library (title, content, category, day_number, cycle_number, chapter, start_verse, end_verse, reference_text) VALUES
-- Cycle 1, Days 1-91 (Proverbs 1-27)
('Proverbs 1:1-11', 'Read Proverbs 1:1-11. Meditate on the wisdom found in this passage and ask God to speak to you.', 'Listening Prayer', 1, 1, 1, 1, 11, 'Proverbs 1:1-11'),
('Proverbs 1:12-22', 'Read Proverbs 1:12-22. Meditate on the wisdom found in this passage and ask God to speak to you.', 'Listening Prayer', 2, 1, 1, 12, 22, 'Proverbs 1:12-22'),
('Proverbs 1:23-33', 'Read Proverbs 1:23-33. Meditate on the wisdom found in this passage and ask God to speak to you.', 'Listening Prayer', 3, 1, 1, 23, 33, 'Proverbs 1:23-33'),
('Proverbs 2:1-11', 'Read Proverbs 2:1-11. Meditate on the wisdom found in this passage and ask God to speak to you.', 'Listening Prayer', 4, 1, 2, 1, 11, 'Proverbs 2:1-11'),
('Proverbs 2:12-22', 'Read Proverbs 2:12-22. Meditate on the wisdom found in this passage and ask God to speak to you.', 'Listening Prayer', 5, 1, 2, 12, 22, 'Proverbs 2:12-22');

-- Note: Complete 91-day plan will be generated via edge function generate-proverbs-plan
