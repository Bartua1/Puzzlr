import SwiftUI
import Combine

enum SubmissionState {
    case parsing
    case loading(gameName: String, scoreText: String)
    case success(message: String)
    case error(message: String)
    case notAuthenticated
    case notParsed
}

class ShareViewModel: ObservableObject {
    @Published var state: SubmissionState = .parsing
    
    let APP_GROUP_ID = "group.com.gonzalo.puzzlr"
    
    var onFinished: (() -> Void)?
    
    func processSharedText(_ text: String) {
        // 1. Check if authenticated
        let userDefaults = UserDefaults(suiteName: APP_GROUP_ID)
        guard let supabaseUrl = userDefaults?.string(forKey: "supabase_url"),
              let supabaseAnonKey = userDefaults?.string(forKey: "supabase_anon_key"),
              let accessToken = userDefaults?.string(forKey: "supabase_access_token"),
              !supabaseUrl.isEmpty, !supabaseAnonKey.isEmpty, !accessToken.isEmpty else {
            self.state = .notAuthenticated
            return
        }
        
        // 2. Parse score
        guard let parsedScore = parseShareText(text) else {
            self.state = .notParsed
            return
        }
        
        let scoreText = "\(parsedScore.score) / \(parsedScore.maxScore)"
        self.state = .loading(gameName: parsedScore.gameName, scoreText: scoreText)
        
        // 3. Submit score to Supabase
        Task {
            let result = await submitScore(
                supabaseUrl: supabaseUrl,
                supabaseAnonKey: supabaseAnonKey,
                accessToken: accessToken,
                score: parsedScore,
                rawText: text
            )
            
            await MainActor.run {
                switch result {
                case .success(let msg):
                    self.state = .success(message: msg)
                    // Auto-close after 1.5s
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        self.onFinished?()
                    }
                case .failure(let err):
                    self.state = .error(message: err.localizedDescription)
                }
            }
        }
    }
}

struct ShareView: View {
    @ObservedObject var viewModel: ShareViewModel
    
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
                        Text("Close")
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
                Text("Analyzing shared text...")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }
            
        case .loading(let gameName, let scoreText):
            VStack(spacing: 12) {
                ProgressView()
                    .padding(.bottom, 8)
                Text(gameName)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(scoreText)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.gray)
                Text("Saving your score...")
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
            }
            
        case .success(let message):
            VStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(Color(red: 19/255, green: 115/255, blue: 51/255)) // green-700
                    .padding(.bottom, 8)
                Text("Success!")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(message)
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color(red: 19/255, green: 115/255, blue: 51/255))
                    .padding(.horizontal, 8)
            }
            
        case .error(let message):
            VStack(spacing: 12) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(Color(red: 197/255, green: 34/255, blue: 31/255)) // red-700
                    .padding(.bottom, 8)
                Text("Submission Failed")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text(message)
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
            
        case .notAuthenticated:
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.orange)
                    .padding(.bottom, 8)
                Text("Not Logged In")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text("Please open Puzzlr and log in first to submit your scores.")
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
            
        case .notParsed:
            VStack(spacing: 12) {
                Image(systemName: "questionmark.circle.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.gray)
                    .padding(.bottom, 8)
                Text("Unknown Score Format")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color(red: 15/255, green: 23/255, blue: 42/255))
                Text("Could not recognize daily score format in the shared content.")
                    .font(.system(size: 14))
                    .multilineTextAlignment(.center)
                    .foregroundColor(.gray)
                    .padding(.horizontal, 8)
            }
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
