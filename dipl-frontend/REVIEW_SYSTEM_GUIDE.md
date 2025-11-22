# 📝 Smernice za Review Sistem

## 🎯 Kako funkcioniše Review Sistem

Review sistem omogućava:

- **Korisnicima** da ocenjuju organizacije nakon završenih događaja
- **Organizacijama** da ocenjuju volontere nakon završenih događaja

---

## ✅ Uslovi za davanje ocene

### Za korisnike (ocenjivanje organizacije):

1. ✅ Korisnik je prijavljen na događaj
2. ✅ Prijava je **prihvaćena** (status: "accepted")
3. ✅ Događaj je **završen** (end_date < sadašnji datum)

### Za organizacije (ocenjivanje volontera):

1. ✅ Volonter je prijavljen na događaj
2. ✅ Prijava je **prihvaćena** (status: "accepted")
3. ✅ Događaj je **završen** (end_date < sadašnji datum)

---

## 🧪 Testiranje Review Sistema

### Privremena logika (za testiranje):

Trenutno je omogućeno davanje ocena i za **buduće događaje** (samo za testiranje).

**Fajlovi sa privremenom logikom:**

- `src/pages/user/MyApplications.tsx` - funkcija `canReview()`
- `src/pages/organisation/EventApplications.tsx` - funkcija `canReviewUser()`

### Kako testirati:

1. **Kreiraj događaj** (može biti i budući)
2. **Korisnik se prijavljuje** na događaj
3. **Organizacija prihvata** prijavu
4. **Pojaviće se dugme za review:**
   - Korisnik: "Oceni organizaciju" u "Moje prijave"
   - Organizacija: "Oceni" u "Prijave na događaj" ili "Sve prijave"

---

## 🔄 Vraćanje na validnu logiku

Kada napunite review bazu i završite testiranje, vratite validnu logiku:

### U `src/pages/user/MyApplications.tsx`:

```typescript
const canReview = (app: ApplicationPublic): boolean => {
  if (app.status !== "accepted") {
    return false;
  }

  const event = events.get(app.event_title);
  if (!event || !event.end_date) {
    return false;
  }

  // VRATITI NA OVO:
  const now = new Date();
  const eventEndDate = new Date(event.end_date);
  return eventEndDate < now; // Događaj mora biti završen
};
```

### U `src/pages/organisation/EventApplications.tsx`:

```typescript
const canReviewUser = (app: ApplicationPublic): boolean => {
  if (app.status !== "accepted") {
    return false;
  }

  if (!event || !event.end_date) {
    return false;
  }

  // VRATITI NA OVO:
  const now = new Date();
  const eventEndDate = new Date(event.end_date);
  return eventEndDate < now; // Događaj mora biti završen
};
```

**Takođe obrisati komentare sa "TODO: PRIVREMENO ZA TESTIRANJE"**

---

## 📊 Prikaz ocena

### Gde se prikazuju ocene:

1. **User Dashboard** (`/user/dashboard`)

   - Prosečna ocena i broj ocena u profil sekciji

2. **Organisation Dashboard** (`/org/dashboard`)

   - Prosečna ocena i broj ocena u header-u

3. **Organisation Profile** (`/org/profile`)

   - Prosečna ocena i broj ocena u profil sekciji

4. **Public User Profile** (`/users/:username`)

   - Prosečna ocena i lista svih review-a

5. **Public Organisation Profile** (`/organisations/:username`)
   - Prosečna ocena i broj ocena u statistike sekciji

---

## 🎨 Kako dati ocenu

### Korisnik ocenjuje organizaciju:

1. Idite na **"Moje prijave"** (`/user/applications`)
2. Pronađite prihvaćenu prijavu za završeni događaj
3. Kliknite na **"Oceni organizaciju"** ⭐
4. Izaberite ocenu (1-5 zvezdica)
5. (Opciono) Dodajte komentar (max 500 karaktera)
6. Kliknite **"Pošalji ocenu"**

### Organizacija ocenjuje volontera:

1. Idite na **"Prijave na događaj"** (`/org/events/:eventId/applications`) ili **"Sve prijave"** (`/org/applications`)
2. Pronađite prihvaćenu prijavu za završeni događaj
3. Kliknite na **"Oceni"** ⭐ pored korisnika
4. Izaberite ocenu (1-5 zvezdica)
5. (Opciono) Dodajte komentar (max 500 karaktera)
6. Kliknite **"Pošalji ocenu"**

---

## 🔍 API Endpoint-i

### Kreiranje review-a:

- **User → Org:** `POST /user/reviews/user-to-org/{event_id}`
- **Org → User:** `POST /org/org/{event_id}/rate-user/{user_id}`

### Dobijanje review-a:

- **Reviews za korisnika:** `GET /public/users/user/{user_id}/reviews`
- **Prosečna ocena korisnika:** `GET /public/users/user/{user_id}/avg-rating`
- **Reviews za organizaciju:** `GET /public/organisations/org/{org_id}/reviews`
- **Prosečna ocena organizacije:** `GET /public/organisations/org/{org_id}/avg-rating`

---

## ⚠️ Napomene

- Jedan korisnik može dati **jednu ocenu** po događaju organizaciji
- Jedna organizacija može dati **jednu ocenu** po događaju volonteru
- Ocena se može dati samo za **prihvaćene prijave**
- Ocena se može dati samo nakon **završetka događaja** (kada se vrati validna logika)

---

## 🐛 Troubleshooting

### Dugme za review se ne pojavljuje:

1. Proverite da li je prijava **prihvaćena** (status: "accepted")
2. Proverite da li je **događaj završen** (end_date < sadašnji datum)
3. Proverite konzolu za greške
4. Proverite da li postoji `event_id` i `user_id` u aplikaciji

### Ocena se ne prikazuje:

1. Proverite da li je review uspešno poslat (toast notifikacija)
2. Osvežite stranicu
3. Proverite API endpoint-e u Network tab-u
4. Proverite da li backend vraća podatke

---

## 📝 Checklist za vraćanje validne logike

- [ ] Napuniti review bazu sa test podacima
- [ ] Testirati sve funkcionalnosti
- [ ] Vratiti validnu logiku u `MyApplications.tsx`
- [ ] Vratiti validnu logiku u `EventApplications.tsx`
- [ ] Obrisati komentare sa "TODO: PRIVREMENO"
- [ ] Testirati da review radi samo za završene događaje
- [ ] Obrisati ovaj fajl (REVIEW_SYSTEM_GUIDE.md) ako više nije potreban


