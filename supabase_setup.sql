-- ═══════════════════════════════════════════════════════
-- CHẠY FILE NÀY TRONG SUPABASE > SQL EDITOR
-- ═══════════════════════════════════════════════════════

-- Bảng từ vựng
CREATE TABLE IF NOT EXISTS words (
    id          SERIAL PRIMARY KEY,
    english     TEXT NOT NULL,
    phonetic    TEXT DEFAULT '',
    vietnamese  TEXT NOT NULL,
    type        TEXT DEFAULT 'Other',
    example     TEXT DEFAULT '',
    mastery     INT  DEFAULT 0,
    favorite    BOOL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng câu speaking
CREATE TABLE IF NOT EXISTS phrases (
    id          SERIAL PRIMARY KEY,
    english     TEXT NOT NULL,
    vietnamese  TEXT NOT NULL,
    note        TEXT DEFAULT '',
    situation   TEXT DEFAULT 'Daily',
    favorite    BOOL DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Cho phép đọc/ghi không cần đăng nhập (anon key)
ALTER TABLE words   ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_words"   ON words   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_phrases" ON phrases FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- DỮ LIỆU MẪU (tuỳ chọn)
-- ═══════════════════════════════════════════════════════
INSERT INTO words (english, phonetic, vietnamese, type, example, mastery, favorite) VALUES
('Ephemeral',   'ɪˈfem.ər.əl',      'Thoáng qua, không bền lâu',   'Adj',  'The beauty of cherry blossoms is ephemeral.', 2, true),
('Ubiquitous',  'juːˈbɪk.wɪ.təs',   'Có mặt khắp nơi, phổ biến',  'Adj',  'Smartphones have become ubiquitous.',         1, false),
('Serendipity', 'ˌser.ənˈdɪp.ɪ.ti', 'Sự tình cờ may mắn',         'Noun', 'Finding that old book was pure serendipity.', 3, true),
('Persevere',   'ˌpɜː.sɪˈvɪər',     'Kiên trì, bền bỉ',           'Verb', 'She persevered through every challenge.',     0, false),
('Eloquent',    'ˈel.ə.kwənt',       'Hùng hồn, lưu loát',         'Adj',  'He gave an eloquent speech.',                1, false);

INSERT INTO phrases (english, vietnamese, note, situation, favorite) VALUES
('Could you say that again, please?',    'Bạn có thể nói lại được không?',       'Nhấn vào say và again',        'Daily',   false),
('I''d like to make a point about this.','Tôi muốn nêu một ý kiến.',              'Dùng trong meeting',           'Meeting', true),
('Let me think about that for a moment.','Để tôi suy nghĩ một chút.',             'Câu giờ tự nhiên khi speaking','Daily',   true),
('That''s a great point!',              'Đó là một ý hay!',                      'Nhấn vào great',               'Meeting', true),
('Could I get the bill, please?',       'Cho tôi hóa đơn được không?',           'Giọng lên ở cuối câu',         'Travel',  false);
