from django.apps import AppConfig
import os
import sys
import threading


class PricessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pricess'

    def ready(self):
        # In dev mode the reloader spawns a child process; only run there.
        # In production (gunicorn/uwsgi) RUN_MAIN is not set — always run.
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return
        if 'test' in sys.argv:
            return

        import pricess.views as views

        # Mark as in-progress immediately so the first browser poll sees it.
        views._fetch_status.update({
            "running": True,
            "done": False,
            "progress": 0,
            "total": len(views.PRICES_TO_FETCH),
            "current_item": "",
        })

        def _startup():
            try:
                views.fetch_prices()
            except Exception as e:
                print(f"[ارزبان] startup fetch failed: {e}")
                views._fetch_status.update({"done": True, "running": False})

        threading.Thread(target=_startup, daemon=True).start()
