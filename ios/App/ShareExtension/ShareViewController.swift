import UIKit
import Social
import UniformTypeIdentifiers
import MobileCoreServices

class ShareViewController: UIViewController {
    let APP_GROUP_ID = "group.com.gonzalo.puzzlr"
    let APP_URL_SCHEME = "com.gonzalo.puzzlr"
    
    private var texts: [[String: Any]] = []

    override public func viewDidLoad() {
        super.viewDidLoad()
        
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            self.exit()
            return
        }

        Task {
            for provider in attachments {
                // Check if the shared content is plain text
                if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                    if let text = try? await provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) as? String {
                        self.texts.append([
                            "value": text,
                            "text": text,
                            "type": "text/plain"
                        ])
                    }
                }
                // Check if the shared content is a URL
                else if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    if let url = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) as? URL {
                        self.texts.append([
                            "value": url.absoluteString,
                            "text": url.absoluteString,
                            "type": "text/plain"
                        ])
                    }
                }
            }

            // Save the data to Shared UserDefaults
            let shareData: [String: Any] = [
                "title": extensionItem.attributedTitle?.string ?? "",
                "texts": self.texts,
                "files": []
            ]
            
            let userDefaults = UserDefaults(suiteName: APP_GROUP_ID)
            userDefaults?.set(shareData, forKey: "share-target-data")
            userDefaults?.synchronize()

            // Redirect and launch your main app
            if let url = URL(string: "\(APP_URL_SCHEME)://share") {
                self.openURL(url)
            }
            
            // Allow the system a moment to process the URL scheme launch before terminating the extension
            try? await Task.sleep(nanoseconds: 800_000_000) // 0.8 seconds
            
            await MainActor.run {
                self.exit()
            }
        }
    }

    private func openURL(_ url: URL) {
        // 1. Try using the responder chain to find UIApplication
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.perform(Selector(("openURL:")), with: url)
                return
            }
            responder = responder?.next
        }
        
        // 2. Try calling the private selector openURL:completionHandler: on NSExtensionContext
        let contextSelector = Selector(("openURL:completionHandler:"))
        if let context = self.extensionContext, context.responds(to: contextSelector) {
            context.perform(contextSelector, with: url, with: nil)
            return
        }

        // 3. Fallback to openURL: on NSExtensionContext
        let contextSelectorLegacy = Selector(("openURL:"))
        if let context = self.extensionContext, context.responds(to: contextSelectorLegacy) {
            context.perform(contextSelectorLegacy, with: url)
            return
        }
    }

    private func exit() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}