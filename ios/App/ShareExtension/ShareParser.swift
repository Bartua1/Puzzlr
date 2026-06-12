import Foundation

struct ParsedScore {
    let gameId: String
    let gameName: String
    let score: Int
    let maxScore: Int
    let puzzleNumber: String
}

func parseShareText(_ text: String) -> ParsedScore? {
    let cleanText = text.trimmingCharacters(in: .whitespacesAndNewlines)
    
    // 1. Daily Word Grid (Wordle-like)
    // /(?:Wordle|Daily\s+Word\s+Grid)\s*([\d,]+)\s+([1-6xX])\/6/i
    if let wordleMatch = matchRegex(pattern: "(?i)(?:Wordle|Daily\\s+Word\\s+Grid)\\s*([\\d,]+)\\s+([1-6xX])/6", text: cleanText) {
        let puzzleNumber = wordleMatch[1].replacingOccurrences(of: ",", with: "")
        let scoreChar = wordleMatch[2].uppercased()
        let score = scoreChar == "X" ? 0 : (Int(scoreChar) ?? 0)
        let points = score == 0 ? 0 : 7 - score
        return ParsedScore(gameId: "word_grid", gameName: "Daily Word Grid", score: points, maxScore: 6, puzzleNumber: puzzleNumber)
    }
    
    // 1.5 Spanish Wordle (La palabra del día)
    // /(?:La\s+palabra\s+del\s+d[ií]a)\s*#?([\d,]+)\s+([1-6xX])\/6/i
    if let laPalabraMatch = matchRegex(pattern: "(?i)(?:La\\s+palabra\\s+del\\s+d[ií]a)\\s*#?([\\d,]+)\\s+([1-6xX])/6", text: cleanText) {
        let puzzleNumber = laPalabraMatch[1].replacingOccurrences(of: ",", with: "")
        let scoreChar = laPalabraMatch[2].uppercased()
        let score = scoreChar == "X" ? 0 : (Int(scoreChar) ?? 0)
        let points = score == 0 ? 0 : 7 - score
        return ParsedScore(gameId: "wordle_es", gameName: "La Palabra del Día", score: points, maxScore: 6, puzzleNumber: puzzleNumber)
    }
    
    // 2. Group Categorization Game (Connections-like)
    // /(?:Connections|Group\s+Categorization\s+Game)\s*(?:Puzzle\s*)?#?([\d,]+)/i
    if let connectionsMatch = matchRegex(pattern: "(?i)(?:Connections|Group\\s+Categorization\\s+Game)\\s*(?:Puzzle\\s*)?#?([\\d,]+)", text: cleanText) {
        let puzzleNumber = connectionsMatch[1].replacingOccurrences(of: ",", with: "")
        
        // Count emojis
        let lines = cleanText.components(separatedBy: .newlines)
        var correctGroups = 0
        let colorEmojis = ["🟨", "🟩", "🟦", "🟪"]
        
        for line in lines {
            let cleanedLine = line.replacingOccurrences(of: " ", with: "")
            for emoji in colorEmojis {
                let fourEmoji = String(repeating: emoji, count: 4)
                if cleanedLine.contains(fourEmoji) {
                    correctGroups += 1
                    break
                }
            }
        }
        
        if correctGroups == 0 {
            // Count all matching emojis
            let allEmojis = cleanText.filter { "🟨🟩🟦🟪".contains($0) }
            if !allEmojis.isEmpty {
                correctGroups = min(4, allEmojis.count / 4)
            } else {
                correctGroups = 4 // Fallback default
            }
        }
        
        return ParsedScore(gameId: "word_group", gameName: "Group Categorization Game", score: correctGroups, maxScore: 4, puzzleNumber: puzzleNumber)
    }
    
    // 3. Queen's Grid (Queens-like)
    // /(?:Queens|Queen's\s+Grid|Queens\s+Grid|Chess\s+Puzzle)\s*#?([\d,]+)(?:\s*-\s*(\d+):(\d+))?/i
    if let queensMatch = matchRegex(pattern: "(?i)(?:Queens|Queen's\\s+Grid|Queens\\s+Grid|Chess\\s+Puzzle)\\s*#?([\\d,]+)(?:\\s*-\\s*(\\d+):(\\d+))?", text: cleanText) {
        let puzzleNumber = queensMatch[1].replacingOccurrences(of: ",", with: "")
        var score = 10
        
        if queensMatch.count >= 4 && !queensMatch[2].isEmpty && !queensMatch[3].isEmpty {
            let minutes = Int(queensMatch[2]) ?? 0
            let seconds = Int(queensMatch[3]) ?? 0
            let totalSeconds = minutes * 60 + seconds
            score = max(10, 100 - (totalSeconds / 10))
        }
        
        return ParsedScore(gameId: "chess_grid", gameName: "Queen's Grid", score: score, maxScore: 100, puzzleNumber: puzzleNumber)
    }
    
    return nil
}

func matchRegex(pattern: String, text: String) -> [String]? {
    guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else { return nil }
    let range = NSRange(text.startIndex..., in: text)
    guard let match = regex.firstMatch(in: text, options: [], range: range) else { return nil }
    
    var results: [String] = []
    for i in 0..<match.numberOfRanges {
        let matchRange = match.range(at: i)
        if matchRange.location != NSNotFound, let r = Range(matchRange, in: text) {
            results.append(String(text[r]))
        } else {
            results.append("")
        }
    }
    return results.isEmpty ? nil : results
}

func submitScore(supabaseUrl: String, supabaseAnonKey: String, accessToken: String, score: ParsedScore, rawText: String, language: String) async -> Result<String, Error> {
    guard let url = URL(string: "\(supabaseUrl)/rest/v1/rpc/submit_daily_score_rpc") else {
        return .failure(NSError(domain: "SupabaseError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid Supabase URL"]))
    }
    
    // Solved date formatted as YYYY-MM-DD
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone.current
    let solvedDate = formatter.string(from: Date())
    
    let body: [String: Any] = [
        "p_game_id": score.gameId,
        "p_raw_text": rawText,
        "p_score": score.score,
        "p_max_score": score.maxScore,
        "p_solved_date": solvedDate
    ]
    
    guard let jsonData = try? JSONSerialization.data(withJSONObject: body, options: []) else {
        return .failure(NSError(domain: "SupabaseError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Failed to serialize JSON body"]))
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.httpBody = jsonData
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    request.addValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
    request.addValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
    
    do {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            return .failure(NSError(domain: "NetworkError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid server response"]))
        }
        
        if httpResponse.statusCode == 200 {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                let success = json["success"] as? Bool ?? false
                let message = json["message"] as? String ?? ""
                
                if success {
                    if let points = json["points_earned"] as? Int {
                        let isEs = language.lowercased().hasPrefix("es")
                        let template = isEs ? "¡Puntuación guardada! Has ganado %d puntos." : "Score saved! Earned %d points."
                        return .success(String(format: template, points))
                    } else {
                        return .success(message)
                    }
                } else {
                    return .failure(NSError(domain: "RPCError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: message]))
                }
            }
            let isEs = language.lowercased().hasPrefix("es")
            let successMsg = isEs ? "Puntuación enviada con éxito." : "Score submitted successfully."
            return .success(successMsg)
        } else {
            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let message = json["message"] as? String {
                var displayMessage = message
                let isEs = language.lowercased().hasPrefix("es")
                if message.contains("duplicate key value violates unique constraint") || message.contains("unique_user_game_date") {
                    displayMessage = isEs ? "Ya has enviado una puntuación para este juego hoy." : "You have already submitted a score for this game today."
                }
                return .failure(NSError(domain: "SupabaseError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: displayMessage]))
            }
            let isEs = language.lowercased().hasPrefix("es")
            let errorMessage = String(data: data, encoding: .utf8) ?? (isEs ? "Error de servidor desconocido" : "Unknown server error")
            return .failure(NSError(domain: "SupabaseError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
        }
    } catch {
        return .failure(error)
    }
}
