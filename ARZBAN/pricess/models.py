from django.db import models
class Price(models.Model):
    CATEGORY_CHOICES = [
        ("currency", "نرخ ارز"),
        ("gold", "نرخ طلا و نقره"),
        ("crypto", "بازار کریپتو"),
        ("oil", "نرخ نفت")
    ]

    name = models.CharField(max_length=100)
    value = models.CharField(max_length=50)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default="currency")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.value}"