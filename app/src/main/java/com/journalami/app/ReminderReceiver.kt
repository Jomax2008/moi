package com.journalami.app

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        // On replanifie d'abord, pour que le rappel de demain existe quoi qu'il arrive.
        ReminderScheduler.scheduleNext(context)

        val p = ReminderScheduler.prefs(context)
        if (!p.getBoolean("enabled", false)) return

        // Déjà écrit aujourd'hui : on ne dérange pas.
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        if (p.getString("lastWritten", "") == today) return

        val gentle = p.getBoolean("gentle", false)
        val raw = (if (gentle) p.getString("gentle", "") else p.getString("normal", "")) ?: ""
        val options = raw.split("\n").filter { it.isNotBlank() }
        val text = if (options.isEmpty()) "C'est l'heure de ta page du jour ✍️" else options.random()
        val title = p.getString("title", "Ton journal") ?: "Ton journal"

        ReminderScheduler.ensureChannel(context)

        val openIntent = Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val open = PendingIntent.getActivity(
            context,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = newBuilder(context)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(Notification.BigTextStyle().bigText(text))
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(1, notification)
    }

    @Suppress("DEPRECATION")
    private fun newBuilder(ctx: Context): Notification.Builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(ctx, ReminderScheduler.CHANNEL_ID)
        } else {
            Notification.Builder(ctx)
        }
}
