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
  argocd/                   ArgoCD v3.6.2 (upstream install.yaml + patch: Git polling 30 s)
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

## Bootstrap

```bash
minikube start -p tp4 --driver=vmware --cpus=4 --memory=8192
git switch tp4-gitops
./devOps/TP4/gitops/bootstrap/install.sh
```

## Day-2: everything is a commit

| Goal | Change |
|---|---|
| Scale prod | `replicas[0].count` in `workloads/podinfo/overlays/prod/kustomization.yaml`, then push to `tp4-gitops` |
| New version | `images[0].newTag` in the same file |
| Roll back | `git revert <sha>` (or ArgoCD *History and Rollback* after disabling auto-sync) |
| New alert | add a rule to `monitoring/config/prometheusrule-gitops.yaml` |
