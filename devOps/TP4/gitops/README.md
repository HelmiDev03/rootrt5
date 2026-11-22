# TP4 GitOps repository

GitOps repository of TP4 (DevOps, RT5 INSAT): **ArgoCD** continuously deploys the
`podinfo` microservice and a **Prometheus / Grafana** observability stack to Kubernetes.
This folder is the single source of truth: nothing is applied to the cluster by hand
except the bootstrap below.

ArgoCD watches the **`tp4-gitops` branch** of this repository (`HelmiDev03/rootrt5`), path
`devOps/TP4/gitops/`. The live demo commits (scale, image tag, broken tag, revert) are made on
that branch so that `main`, which publishes the course site, only receives the final state.
The report (architecture, the 5 scenarios with logs and screenshots, PromQL queries) is
`../doc.html`.

## Layout

```
bootstrap/                  imperative, run once
  argocd/                   ArgoCD v3.6.2 (upstream install.yaml + patches: Git polling 30 s,
                            repo-server timeouts 300 s for the first clone of this big repo)
  root-app.yaml             App-of-Apps: syncs apps/
  install.sh                install ArgoCD, Grafana secret, root app
apps/                       declarative ArgoCD objects (synced by root)
  project.yaml              AppProject "tp4" (allowed repos / namespaces / cluster kinds)
  podinfo-dev.yaml          -> workloads/podinfo/overlays/dev   (auto-sync + self-heal)
  podinfo-prod.yaml         -> workloads/podinfo/overlays/prod  (auto-sync + self-heal)
  monitoring-stack.yaml     -> kube-prometheus-stack 93.3.0 (Helm) + values from this repo
  monitoring-config.yaml    -> monitoring/config
workloads/podinfo/
  base/                     Deployment, Service, ServiceMonitor, load generator
  overlays/dev|prod/        namespace, image tag, replicas, UI colour/message
monitoring/
  values/                   kube-prometheus-stack values
  config/                   ArgoCD ServiceMonitors, PrometheusRule, Grafana dashboard JSON
```

## Architecture

```
developer --git push--> GitHub (rootrt5, branch tp4-gitops)
                              ^  pull every 30 s (no inbound access to the cluster)
                              |
  minikube "tp4" ------------ | --------------------------------------------------
   argocd      repo-server -> application-controller --apply--> podinfo-prod / podinfo-dev
               root (App-of-Apps) -> AppProject tp4, podinfo-dev, podinfo-prod,
                                     monitoring-stack (Helm), monitoring-config
   monitoring  Prometheus <-scrape- ArgoCD metrics (:8082 :8083 :8084 :8080), podinfo :9797,
                                    kube-state-metrics, kubelet/cAdvisor, node-exporter
               Grafana (sidecar loads the dashboard JSON) · Alertmanager (PrometheusRule tp4)
```

## Technical choices

- **Kustomize base + overlays** for the workload: environments only state what differs
  (namespace, `images:` tag, `replicas:`, UI colour); demo changes are one-line diffs.
- **App-of-Apps**: only `root` is created by hand; the monitoring stack is GitOps too.
- **AppProject `tp4`**: allowed source repos, destination namespaces and cluster-scoped kinds.
- **Sync waves + retry + `SkipDryRunOnMissingResource`**: the first install converges although the
  ServiceMonitor CRD only arrives with kube-prometheus-stack.
- **`ignoreDifferences: /spec/syncPolicy`** on the child apps (in `root`): an operator can switch
  auto-sync off for an ArgoCD rollback without root's self-heal switching it back on.
- **Helm multi-source** for kube-prometheus-stack (chart pinned to 93.3.0, values from this repo,
  `ServerSideApply=true` for the large CRDs); Prometheus selects every ServiceMonitor/rule of the
  cluster (`*SelectorNilUsesHelmValues: false`), so apps ship their own scrape config.
- **No secret in Git**: the Grafana admin password is created by `install.sh` (`existingSecret`).
- **podinfo**: instrumented Go microservice (versioned images, probes, `/metrics` on :9797,
  `http_request_duration_seconds{method,path,status}`); `loadgen` sends ~2 req/s, 5 % to `/status/500`.

## PromQL used in the dashboard (`monitoring/config/dashboards/tp4-gitops-overview.json`)

| Panel | Query |
|---|---|
| Apps Synced / OutOfSync | `count(argocd_app_info{sync_status="Synced"})` · `count(argocd_app_info{sync_status="OutOfSync"}) or vector(0)` |
| Apps Healthy / Degraded | `count(argocd_app_info{health_status="Healthy"})` · `count(argocd_app_info{health_status=~"Degraded\|Progressing"}) or vector(0)` |
| Health timeline | `(max by (name) (argocd_app_info{health_status="Healthy"}) * 0) or (max by (name) (argocd_app_info{health_status="Progressing"}) * 0 + 1) or (max by (name) (argocd_app_info{health_status="Degraded"}) * 0 + 2)` |
| Sync history | `sum by (name, phase) (increase(argocd_app_sync_total[2m]))` · `round(sum(increase(argocd_app_sync_total[1h])))` |
| Git calls | `sum by (request_type) (rate(argocd_git_request_total[2m]))` |
| Reconciliation p95 | `histogram_quantile(0.95, sum by (le) (rate(argocd_app_reconcile_bucket[5m])))` |
| Pods desired / available / unavailable | `sum(kube_deployment_spec_replicas{namespace=~"$namespace",deployment="podinfo"})` · `..._status_replicas_available` · `..._status_replicas_unavailable` |
| Waiting reasons | `sum by (reason) (kube_pod_container_status_waiting_reason{namespace=~"$namespace"}) > 0` |
| Restarts | `sum by (pod) (increase(kube_pod_container_status_restarts_total{namespace=~"$namespace"}[10m]))` |
| CPU / memory | `sum by (pod) (rate(container_cpu_usage_seconds_total{namespace=~"$namespace",container!="",container!="POD"}[2m]))` · `sum by (pod) (container_memory_working_set_bytes{...})` |
| Image version | `count by (image) (kube_pod_container_info{namespace=~"$namespace",container="podinfo"})` |
| HTTP rate / errors / latency | `sum by (status) (rate(http_request_duration_seconds_count{namespace=~"$namespace",path!~"healthz\|readyz"}[2m]))` · 5xx ratio · `histogram_quantile(0.95, ...bucket...)` |
| Annotations | `sum by (name, phase) (increase(argocd_app_sync_total[1m])) > 0` (syncs) · `ALERTS{alertstate="firing"}` |

## Alerts (`monitoring/config/prometheusrule-gitops.yaml`)

| Alert | Condition | for |
|---|---|---|
| ArgoCDAppDegraded | `argocd_app_info{health_status="Degraded"} == 1` | 2m |
| ArgoCDAppOutOfSync | `argocd_app_info{sync_status="OutOfSync"} == 1` | 2m |
| ArgoCDSyncFailed | `increase(argocd_app_sync_total{phase=~"Error\|Failed"}[5m]) > 0` | - |
| PodImagePullOrCrashLoop | `max by (namespace,pod,container) (kube_pod_container_status_waiting_reason{reason=~"ErrImagePull\|ImagePullBackOff\|CrashLoopBackOff"}) == 1` | 1m |
| PodinfoHighErrorRate | 5xx ratio > 20 % | 5m |

`reason` is deliberately **not** kept in `PodImagePullOrCrashLoop`: the kubelet flips between
ErrImagePull and ImagePullBackOff, which would restart the `for` timer at every flip.

## Bootstrap

```bash
minikube start -p tp4 --driver=vmware --cpus=4 --memory=8192
git switch tp4-gitops
./devOps/TP4/gitops/bootstrap/install.sh
# UIs
kubectl -n argocd port-forward svc/argocd-server 8080:443                         # https://localhost:8080
kubectl -n monitoring port-forward svc/kps-grafana 3000:80                        # http://localhost:3000
kubectl -n monitoring port-forward svc/kps-kube-prometheus-stack-prometheus 9090:9090
```

## Day-2: everything is a commit

| Goal | Change |
|---|---|
| Scale prod | `replicas[0].count` in `workloads/podinfo/overlays/prod/kustomization.yaml`, then push to `tp4-gitops` |
| New version | `images[0].newTag` in the same file |
| Roll back | `git revert <sha>` (or ArgoCD *History and Rollback*: `argocd app set podinfo-prod --sync-policy none`, `argocd app rollback podinfo-prod <id>`, then revert in Git and re-enable auto-sync) |
| New alert | add a rule to `monitoring/config/prometheusrule-gitops.yaml` |
