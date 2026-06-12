import Foundation
import Capacitor

@objc(AppGroupPlugin)
public class AppGroupPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppGroupPlugin"
    public let jsName = "AppGroupPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise)
    ]

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Key is required")
            return
        }

        let value = call.getString("value")
        let userDefaults = UserDefaults(suiteName: "group.com.gonzalo.puzzlr")
        
        if let val = value {
            userDefaults?.set(val, forKey: key)
        } else {
            userDefaults?.removeObject(forKey: key)
        }
        
        userDefaults?.synchronize()
        call.resolve()
    }
}
