package com.journalami.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Après un redémarrage (ou une mise à jour de l'app), Android oublie les alarmes : on les remet. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        ReminderScheduler.scheduleNext(context)
    }
}
