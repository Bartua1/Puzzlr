import SwiftUI
import Combine

enum SubmissionState: Equatable {
    case parsing
    case loading(gameId: String, scoreText: String)
    case success(message: String)
    case error(message: String)
    case notAuthenticated
    case notParsed
}

@MainActor
class ShareViewModel: ObservableObject {
    @Published var state: SubmissionState = .parsing
    @Published var language: String = "en"
    
    let APP_GROUP_ID = "group.com.gonzalo.puzzlr"
    
    var onFinished: (() -> Void)?
    
    func processSharedText(_ text: String) {
        let userDefaults = UserDefaults(suiteName: APP_GROUP_ID)
        self.language = userDefaults?.string(forKey: "supabase_language") ?? "en"
        
        // 1. Check if authenticated
        guard let supabaseUrl = userDefaults?.string(forKey: "supabase_url"),
              let supabaseAnonKey = userDefaults?.string(forKey: "supabase_anon_key"),
              let accessToken = userDefaults?.string(forKey: "supabase_access_token"),
              !supabaseUrl.isEmpty, !supabaseAnonKey.isEmpty, !accessToken.isEmpty else {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                self.state = .notAuthenticated
            }
            return
        }
        
        // 2. Parse score
        guard let parsedScore = parseShareText(text) else {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                self.state = .notParsed
            }
            return
        }
        
        let scoreText = "\(parsedScore.score) / \(parsedScore.maxScore)"
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            self.state = .loading(gameId: parsedScore.gameId, scoreText: scoreText)
        }
        
        // 3. Submit score to Supabase
        Task {
            let result = await submitScore(
                supabaseUrl: supabaseUrl,
                supabaseAnonKey: supabaseAnonKey,
                accessToken: accessToken,
                score: parsedScore,
                rawText: text,
                language: self.language
            )
            
            await MainActor.run {
                switch result {
                case .success(let msg):
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.75)) {
                        self.state = .success(message: msg)
                    }
                    // Auto-close after 3.0s
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                        self.onFinished?()
                    }
                case .failure(let err):
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        self.state = .error(message: err.localizedDescription)
                    }
                }
            }
        }
    }
}

struct LocalizedStrings {
    static func translate(_ key: String, lang: String) -> String {
        let isEs = lang.lowercased().hasPrefix("es")
        switch key {
        case "close":
            return isEs ? "Cerrar" : "Close"
        case "analyzing":
            return isEs ? "Analizando texto compartido..." : "Analyzing shared text..."
        case "saving":
            return isEs ? "Guardando tu puntuación..." : "Saving your score..."
        case "success":
            return isEs ? "¡Éxito!" : "Success!"
        case "submission_failed":
            return isEs ? "Error de Envío" : "Submission Failed"
        case "not_logged_in":
            return isEs ? "Sesión no Iniciada" : "Not Logged In"
        case "login_instruction":
            return isEs ? "Por favor, abre Puzzlr e inicia sesión primero para enviar tus puntuaciones." : "Please open Puzzlr and log in first to submit your scores."
        case "unknown_format":
            return isEs ? "Formato de Puntuación Desconocido" : "Unknown Score Format"
        case "format_instruction":
            return isEs ? "No se pudo reconocer el formato de la puntuación diaria en el contenido compartido." : "Could not recognize daily score format in the shared content."
        default:
            return key
        }
    }
}

struct ShareView: View {
    @ObservedObject var viewModel: ShareViewModel
    
    @State private var successScale: CGFloat = 0.6
    @State private var errorScale: CGFloat = 0.6
    
    private func t(_ key: String) -> String {
        return LocalizedStrings.translate(key, lang: viewModel.language)
    }
    
    private func translateGameName(_ gameId: String) -> String {
        let isEs = viewModel.language.lowercased().hasPrefix("es")
        switch gameId {
        case "word_grid":
            return isEs ? "La Palabra del Día" : "Daily Word Grid"
        case "wordle_es":
            return "La Palabra del Día"
        case "word_group":
            return isEs ? "Categorización de Grupos" : "Group Categorization Game"
        case "chess_grid":
            return isEs ? "Cuadrícula de la Reina" : "Queen's Grid"
        default:
            return gameId
        }
    }
    
    var body: some View {
        ZStack {
            // Semi-transparent background
            Color.black.opacity(0.4)
                .edgesIgnoringSafeArea(.all)
            
            // Centered Modal Dialog Card
            VStack(spacing: 20) {
                // Header / Icon
                headerView
                
                // Status content
                contentView
                
                // Actions
                if showCloseButton {
                    Button(action: {
                        viewModel.onFinished?()
                    }) {
                        Text(t("close"))
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(Color(red: 26/255, green: 115/255, blue: 232/255))
                            .padding(.vertical, 12)
                            .padding(.horizontal, 24)
                            .frame(maxWidth: .infinity)
                            .background(Color(red: 232/255, green: 240/255, blue: 254/255))
                            .cornerRadius(12)
                    }
                }
            }
            .padding(24)
            .frame(width: 320)
            .background(Color(red: 248/255, green: 250/255, blue: 252/255)) // slate-50 background
            .cornerRadius(24)
            .shadow(color: Color.black.opacity(0.15), radius: 20, x: 0, y: 10)
            .animation(.spring(response: 0.45, dampingFraction: 0.8), value: viewModel.state)
        }
    }
    
    private var headerView: some View {
        HStack {
            Image(systemName: "puzzlepiece.extension.fill")
                .font(.system(size: 24))
                .foregroundColor(Color(red: 26/255, green: 115/255, blue: 232/255)) // sky blue
            Text("Puzzlr")
                .font(.system(size: 20, weight: .black))
                .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255)) // slate-900
        }
    }
    
    @ViewBuilder
    private var contentView: some View {
        switch viewModel.state {
        case .parsing:
            VStack(spacing: 12) {
                ProgressView()
                Text(t("analyzing"))
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
            .transition(.opacity)
            
        case .loading(let gameId, let scoreText):
            VStack(spacing: 12) {
                ProgressView()
                    .padding(.bottom, 8)
                Text(translateGameName(gameId))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(scoreText)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.gray)
                Text(t("saving"))
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }
            .transition(.opacity)
            
        case .success(let message):
            VStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 54))
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255)) // Emerald green
                    .scaleEffect(successScale)
                    .onAppear {
                        successScale = 0.6
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                            successScale = 1.0
                        }
                    }
                    .padding(.bottom, 8)
                Text(t("success"))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(message)
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color(red: 16/255, green: 185/255, blue: 129/255))
                    .padding(.horizontal, 8)
            }
            .transition(.asymmetric(insertion: .scale(scale: 0.95).combined(with: .opacity), removal: .opacity))
            
        case .error(let message):
            VStack(spacing: 12) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 54))
                    .foregroundColor(Color(red: 239/255, green: 68/255, blue: 68/255)) // Red-500
                    .scaleEffect(errorScale)
                    .onAppear {
                        errorScale = 0.6
                        withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                            errorScale = 1.0
                        }
                    }
                    .padding(.bottom, 8)
                Text(t("submission_failed"))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(message)
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
            .transition(.asymmetric(insertion: .scale(scale: 0.95).combined(with: .opacity), removal: .opacity))
            
        case .notAuthenticated:
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.orange)
                    .padding(.bottom, 8)
                Text(t("not_logged_in"))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(t("login_instruction"))
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
            .transition(.opacity)
            
        case .notParsed:
            VStack(spacing: 12) {
                Image(systemName: "questionmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.gray)
                    .padding(.bottom, 8)
                Text(t("unknown_format"))
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(t("format_instruction"))
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
            .transition(.opacity)
        }
    }
    
    private var showCloseButton: Bool {
        switch viewModel.state {
        case .parsing, .loading, .success:
            return false
        case .error, .notAuthenticated, .notParsed:
            return true
        }
    }
}
