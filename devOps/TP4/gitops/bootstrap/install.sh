#!/usr/bin/env bash
# Bootstrap of the TP4 GitOps platform. This is the only imperative step:
#   1. install ArgoCD (pinned version) in the "argocd" namespace,
#   2. create the Grafana admin Secret (kept out of Git),
#   3. create the root Application (App-of-Apps).
# From then on, every change goes through Git and is pulled by ArgoCD.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Installing ArgoCD"
# Server-side apply: the ApplicationSet CRD is too large for a client-side apply annotation.
kubectl apply -k argocd --server-side --force-conflicts
kubectl -n argocd rollout status deploy/argocd-server --timeout=300s
kubectl -n argocd rollout status deploy/argocd-repo-server --timeout=300s
kubectl -n argocd rollout status statefulset/argocd-application-controller --timeout=300s

echo "==> Grafana admin secret (not stored in Git)"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
if ! kubectl -n monitoring get secret grafana-admin >/dev/null 2>&1; then
  GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)}"
  kubectl -n monitoring create secret generic grafana-admin \
    --from-literal=admin-user=admin --from-literal=admin-password="$GRAFANA_PASSWORD"
fi

echo "==> Root application (App-of-Apps)"
kubectl apply -f root-app.yaml

cat <<EOF

Done. ArgoCD now pulls everything else from Git.
  ArgoCD UI : kubectl -n argocd port-forward svc/argocd-server 8080:443   -> https://localhost:8080
              user admin, password:
              kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
  Grafana   : kubectl -n monitoring port-forward svc/kps-grafana 3000:80  -> http://localhost:3000
              kubectl -n monitoring get secret grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d
  Prometheus: kubectl -n monitoring port-forward svc/kps-kube-prometheus-stack-prometheus 9090:9090
EOF
