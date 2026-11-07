"""TP3 - IaC with Pulumi (AWS, Python)
1) An Nginx web container on ECS Fargate, exposed publicly through a Load Balancer (port 80)
2) An S3 bucket configured to host a static website
"""
import json
import mimetypes
import os

import pulumi
import pulumi_aws as aws

# ───────────────────────── Network (default VPC) ─────────────────────────
vpc = aws.ec2.get_vpc(default=True)
subnets = aws.ec2.get_subnets(filters=[{"name": "vpc-id", "values": [vpc.id]}])

# Firewall: open port 80 (HTTP) to the whole Internet
web_sg = aws.ec2.SecurityGroup(
    "web-sg",
    vpc_id=vpc.id,
    description="HTTP public (port 80)",
    ingress=[{"protocol": "tcp", "from_port": 80, "to_port": 80, "cidr_blocks": ["0.0.0.0/0"]}],
    egress=[{"protocol": "-1", "from_port": 0, "to_port": 0, "cidr_blocks": ["0.0.0.0/0"]}],
)

# ───────────────────────── 1. Nginx container ─────────────────────────
# Public Load Balancer = fixed address reachable from the Internet
alb = aws.lb.LoadBalancer(
    "nginx-alb",
    load_balancer_type="application",
    security_groups=[web_sg.id],
    subnets=subnets.ids,
)
target_group = aws.lb.TargetGroup(
    "nginx-tg",
    port=80,
    protocol="HTTP",
    target_type="ip",
    vpc_id=vpc.id,
    health_check={"path": "/"},
)
listener = aws.lb.Listener(
    "http-listener",
    load_balancer_arn=alb.arn,
    port=80,
    default_actions=[{"type": "forward", "target_group_arn": target_group.arn}],
)

# ECS cluster + task definition (official nginx image)
cluster = aws.ecs.Cluster("tp3-cluster")
task = aws.ecs.TaskDefinition(
    "nginx-task",
    family="nginx",
    cpu="256",
    memory="512",
    network_mode="awsvpc",
    requires_compatibilities=["FARGATE"],
    container_definitions=json.dumps([{
        "name": "nginx",
        "image": "public.ecr.aws/nginx/nginx:latest",
        "essential": True,
        "portMappings": [{"containerPort": 80, "protocol": "tcp"}],
    }]),
)

# Service: keeps 1 container running and registers it behind the Load Balancer
service = aws.ecs.Service(
    "nginx-svc",
    cluster=cluster.arn,
    task_definition=task.arn,
    desired_count=1,
    launch_type="FARGATE",
    network_configuration={
        "subnets": subnets.ids,
        "security_groups": [web_sg.id],
        "assign_public_ip": True,
    },
    load_balancers=[{
        "target_group_arn": target_group.arn,
        "container_name": "nginx",
        "container_port": 80,
    }],
    opts=pulumi.ResourceOptions(depends_on=[listener]),
)

# ───────────────────────── 2. S3 bucket (static website) ─────────────────────────
site_bucket = aws.s3.Bucket("site-bucket", force_destroy=True)

# Allow a public (read-only) bucket policy on THIS bucket
public_access = aws.s3.BucketPublicAccessBlock(
    "site-public-access",
    bucket=site_bucket.id,
    block_public_acls=True,
    ignore_public_acls=True,
    block_public_policy=False,
    restrict_public_buckets=False,
)

# "Static website" mode
website = aws.s3.BucketWebsiteConfiguration(
    "site-website",
    bucket=site_bucket.id,
    index_document={"suffix": "index.html"},
    error_document={"key": "error.html"},
)

# Everyone can READ the files (s3:GetObject), nobody can write
aws.s3.BucketPolicy(
    "site-policy",
    bucket=site_bucket.id,
    policy=site_bucket.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": f"{arn}/*",
        }],
    })),
    opts=pulumi.ResourceOptions(depends_on=[public_access]),
)

# Upload the files from the www/ folder into the bucket
for name in os.listdir("www"):
    aws.s3.BucketObjectv2(
        name,
        bucket=site_bucket.id,
        key=name,
        source=pulumi.FileAsset(os.path.join("www", name)),
        content_type=mimetypes.guess_type(name)[0] or "text/plain",
    )

# ───────────────────────── Outputs ─────────────────────────
pulumi.export("nginx_url", pulumi.Output.concat("http://", alb.dns_name))
pulumi.export("site_bucket", site_bucket.bucket)
pulumi.export("site_url", pulumi.Output.concat("http://", website.website_endpoint))
