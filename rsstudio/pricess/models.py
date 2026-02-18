from django.db import models

class Price(models.Model):
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=50)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.value}"