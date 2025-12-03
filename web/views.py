from django.shortcuts import render


def index(request, page: str = "home"):
  """Serve the main landing page with the requested section active."""
  safe_page = page if page in {"home", "services", "chat", "diary"} else "home"
  return render(request, "index.html", {"current_page": safe_page})
