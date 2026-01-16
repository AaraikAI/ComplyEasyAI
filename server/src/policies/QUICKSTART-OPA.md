# 🚀 Quick Start: OPA Server Setup

Get OPA running in **2-5 minutes**.

---

## ⚡ FASTEST WAY (Docker - Recommended)

### Step 1: Run Setup Script

```bash
cd /home/user/ComplyEasyAI/server/src/policies
./setup-opa.sh
```

Select option 1 (Docker) - takes ~2 minutes

### Step 2: Add to .env

```bash
echo "OPA_ENDPOINT=http://localhost:8181" >> ../../../.env
```

### Step 3: Verify

```bash
curl http://localhost:8181/health
# Should return: {"status":"ok"}
```

**Done!** OPA is running. ✅

---

## 🐳 Docker Manual Setup

```bash
docker run -d \
  --name opa \
  -p 8181:8181 \
  openpolicyagent/opa:latest \
  run --server
```

---

## 📝 Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  opa:
    image: openpolicyagent/opa:latest
    ports:
      - "8181:8181"
    command: run --server
    restart: unless-stopped
```

Start:
```bash
docker-compose up -d
```

---

## 💻 Binary Installation

### Linux
```bash
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa
sudo mv opa /usr/local/bin/
opa run --server
```

### macOS
```bash
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_darwin_amd64
chmod +x opa
sudo mv opa /usr/local/bin/
opa run --server
```

---

## 🧪 Test OPA

### Upload a Policy

```bash
curl -X PUT http://localhost:8181/v1/policies/test \
  --data-binary '
package test
allow {
  input.user == "admin"
}
'
```

### Evaluate Policy

```bash
curl -X POST http://localhost:8181/v1/data/test/allow \
  -H 'Content-Type: application/json' \
  -d '{"input": {"user": "admin"}}'
```

Should return: `{"result": true}`

---

## 🎯 Use with ComplyEasyAI

The Compliance-as-Code service will automatically:
1. Upload policies to OPA
2. Evaluate policies in real-time
3. Integrate with CI/CD pipelines

Just set `OPA_ENDPOINT` in your `.env` and you're done!

---

## 🛑 Stop/Start OPA

**Docker:**
```bash
docker stop opa
docker start opa
```

**Docker Compose:**
```bash
docker-compose down
docker-compose up -d
```

**Binary:**
```bash
# Stop: Ctrl+C or kill the process
# Start: opa run --server
```

---

## 📚 Sample Policies

See `examples/` directory for:
- SOC 2 Access Control
- HIPAA Encryption
- ISO 27001 Password Policy

---

## ⏱️ Time Required

- Docker setup: **2 minutes**
- Docker Compose: **3 minutes**
- Binary install: **5 minutes**

---

## 🎉 Next Steps

1. Create policies in `server/src/policies/`
2. Upload via Compliance-as-Code service
3. Integrate with CI/CD for automated compliance checks

OPA is now ready for production! 🚀
