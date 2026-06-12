import UIKit
import Social
import UniformTypeIdentifiers
import MobileCoreServices
import SwiftUI

class ShareViewController: UIViewController {
    let APP_GROUP_ID = "group.com.gonzalo.puzzlr"
    
    private let viewModel = ShareViewModel()

    override public func viewDidLoad() {
        super.viewDidLoad()
        
        // 1. Setup SwiftUI Hosting View
        setupSwiftUIView()
        
        // 2. Setup ViewModel callback
        viewModel.onFinished = { [weak self] in
            self?.exit()
        }
        
        // 3. Load attachments
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            self.exit()
            return
        }

        Task {
            var sharedText: String? = nil
            
            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                    if let text = try? await provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) as? String {
                        sharedText = text
                        break
                    }
                } else if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    if let url = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) as? URL {
                        sharedText = url.absoluteString
                        break
                    }
                }
            }
            
            guard let textToProcess = sharedText else {
                await MainActor.run {
                    viewModel.state = .notParsed
                }
                return
            }
            
            await MainActor.run {
                viewModel.processSharedText(textToProcess)
            }
        }
    }

    private func setupSwiftUIView() {
        let hostingController = UIHostingController(rootView: ShareView(viewModel: viewModel))
        addChild(hostingController)
        view.addSubview(hostingController.view)
        
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        
        hostingController.didMove(toParent: self)
        
        // Make hosting view background transparent
        hostingController.view.backgroundColor = .clear
    }

    private func exit() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}