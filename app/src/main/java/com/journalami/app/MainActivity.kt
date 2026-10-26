package com.journalami.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Toute l'app (journal, ami(e), thèmes) vit dans assets/www.
 * Cette activité n'est qu'une coquille : WebView + un petit pont pour les rappels et le système.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ReminderScheduler.ensureChannel(this)

        web = WebView(this)
        web.setBackgroundColor(Color.parseColor("#FFF8F0"))
        setContentView(web)

        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.allowFileAccess = true
        s.allowContentAccess = false
        s.textZoom = 100
        s.setSupportZoom(false)

        web.webViewClient = object : WebViewClient() {
            // Aucune navigation hors de l'app : tout ce qui n'est pas local est bloqué.
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return true
                return !url.startsWith("file:///android_asset/")
            }
        }
        web.webChromeClient = WebChromeClient()
        web.addJavascriptInterface(Bridge(), "Android")
        web.loadUrl("file:///android_asset/www/index.html")
    }

    private var pausedAt = 0L

    override fun onPause() {
        super.onPause()
        pausedAt = System.currentTimeMillis()
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        if (pausedAt > 0L) {
            // Le JS verrouille le journal si on est parti plus de 15 s (quand un code est défini).
            val away = System.currentTimeMillis() - pausedAt
            web.evaluateJavascript("window.__fg && window.__fg($away)", null)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Le JS gère d'abord le retour (fermer une fenêtre, revenir à l'accueil…).
        web.evaluateJavascript(
            "(function(){return window.__onBack ? !!window.__onBack() : false;})()"
        ) { handled ->
            if (handled != "true") finish()
        }
    }

    /** Fonctions appelables depuis le JavaScript via window.Android.xxx */
    inner class Bridge {

        @JavascriptInterface
        fun scheduleReminder(hour: Int, minute: Int, title: String, normal: String, gentle: String) {
            ReminderScheduler.enable(applicationContext, hour, minute, title, normal, gentle)
        }

        @JavascriptInterface
        fun cancelReminder() {
            ReminderScheduler.disable(applicationContext)
        }

        /** Jour (aaaa-mm-jj) de la dernière page écrite : évite un rappel inutile. */
        @JavascriptInterface
        fun markWritten(day: String) {
            ReminderScheduler.prefs(applicationContext).edit().putString("lastWritten", day).apply()
        }

        /** Quand la dernière page était lourde, le rappel devient plus doux. */
        @JavascriptInterface
        fun setGentle(on: Boolean) {
            ReminderScheduler.prefs(applicationContext).edit().putBoolean("gentle", on).apply()
        }

        @JavascriptInterface
        fun requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) {
                runOnUiThread {
                    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 11)
                }
            }
        }

        @JavascriptInterface
        fun hasNotificationPermission(): Boolean =
            Build.VERSION.SDK_INT < 33 ||
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

        /** Couleur de la barre d'état / de navigation, pour suivre le thème choisi. */
        @JavascriptInterface
        fun setBars(color: String, lightBackground: Boolean) {
            runOnUiThread {
                try {
                    val c = Color.parseColor(color)
                    window.statusBarColor = c
                    window.navigationBarColor = c
                    var flags = window.decorView.systemUiVisibility
                    flags = if (lightBackground) {
                        flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
                    } else {
                        flags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        flags = if (lightBackground) {
                            flags or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
                        } else {
                            flags and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
                        }
                    }
                    window.decorView.systemUiVisibility = flags
                    web.setBackgroundColor(c)
                } catch (e: Exception) {
                    // couleur invalide : on ignore
                }
            }
        }

        /** Bloque (ou autorise) les captures d'écran et l'aperçu dans les applis récentes. */
        @JavascriptInterface
        fun setSecure(on: Boolean) {
            runOnUiThread {
                if (on) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                }
            }
        }

        @JavascriptInterface
        fun copyText(text: String) {
            runOnUiThread {
                val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                cm.setPrimaryClip(ClipData.newPlainText("Journal Ami", text))
            }
        }

        @JavascriptInterface
        fun shareText(text: String) {
            runOnUiThread {
                val send = Intent(Intent.ACTION_SEND)
                send.type = "text/plain"
                send.putExtra(Intent.EXTRA_TEXT, text)
                startActivity(Intent.createChooser(send, "Partager"))
            }
        }

        /** Seule adresse autorisée : l'annuaire mondial de lignes d'écoute. */
        @JavascriptInterface
        fun openUrl(url: String) {
            if (url != "https://findahelpline.com") return
            runOnUiThread {
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                } catch (e: Exception) {
                    // pas de navigateur : on ignore
                }
            }
        }
    }
}
