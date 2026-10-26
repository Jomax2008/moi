package com.journalami.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import java.util.Calendar

/**
 * Planifie le rappel quotidien de l'ami(e).
 * Les textes viennent de l'interface (ils portent le nom et la personnalité de l'ami(e)).
 */
object ReminderScheduler {
    private const val PREFS = "reminder"
    const val CHANNEL_ID = "journal_ami_reminders"
    private const val REQUEST_CODE = 4242

    fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun enable(ctx: Context, hour: Int, minute: Int, title: String, normal: String, gentle: String) {
        prefs(ctx).edit()
            .putBoolean("enabled", true)
            .putInt("hour", hour.coerceIn(0, 23))
            .putInt("minute", minute.coerceIn(0, 59))
            .putString("title", title)
            .putString("normal", normal)
            .putString("gentle", gentle)
            .apply()
        scheduleNext(ctx)
    }

    fun disable(ctx: Context) {
        prefs(ctx).edit().putBoolean("enabled", false).apply()
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(pendingIntent(ctx))
    }

    /** Programme la prochaine occurrence (aujourd'hui si l'heure n'est pas passée, sinon demain). */
    fun scheduleNext(ctx: Context) {
        val p = prefs(ctx)
        if (!p.getBoolean("enabled", false)) return

        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, p.getInt("hour", 20))
        cal.set(Calendar.MINUTE, p.getInt("minute", 30))
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        if (cal.timeInMillis <= System.currentTimeMillis() + 1000L) {
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }

        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // Alarme « inexacte » : pas besoin de permission spéciale, quelques minutes de décalage possibles.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.timeInMillis, pendingIntent(ctx))
    }

    fun ensureChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Rappels de ton ami(e)",
                    NotificationManager.IMPORTANCE_DEFAULT
                )
                channel.description = "Un petit mot pour te rappeler d'écrire dans ton journal"
                nm.createNotificationChannel(channel)
            }
        }
    }

    private fun pendingIntent(ctx: Context): PendingIntent {
        val intent = Intent(ctx, ReminderReceiver::class.java)
        return PendingIntent.getBroadcast(
            ctx,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
