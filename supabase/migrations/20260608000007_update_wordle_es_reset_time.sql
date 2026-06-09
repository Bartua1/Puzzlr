-- Update reset_time_utc for La Palabra del Día (wordle_es) to 23:00:00 UTC (00:00 CET)
UPDATE public.games
SET reset_time_utc = '23:00:00'
WHERE id = 'wordle_es';
