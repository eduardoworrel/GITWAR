#!/bin/bash
set -e

# GitWorld Deploy Script
# Usage: ./deploy.sh [api|web|all]

# Load .env if exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

APP_ID="${DIGITALOCEAN_APP_ID:?Defina DIGITALOCEAN_APP_ID no .env}"
REGISTRY="registry.digitalocean.com/programador-tv"

deploy_api() {
    echo "🔨 Building API..."
    cd "$(dirname "$0")"
    docker buildx build --platform linux/amd64 -t gitworld-api:latest -f src/GitWorld.Api/Dockerfile .

    echo "🏷️  Tagging..."
    docker tag gitworld-api:latest $REGISTRY/gitworld-api:latest

    echo "📤 Pushing to registry..."
    docker push $REGISTRY/gitworld-api:latest

    echo "✅ API image pushed"
}

deploy_web() {
    echo "🔨 Building Web..."
    cd "$(dirname "$0")/web"

    # Build with production S2 stream settings
    docker buildx build --platform linux/amd64 \
        --build-arg VITE_S2_STREAM=game-state \
        --build-arg VITE_S2_BASIN=gitworld \
        -t gitworld-web:latest .

    echo "🏷️  Tagging..."
    docker tag gitworld-web:latest $REGISTRY/gitworld-api:web-latest

    echo "📤 Pushing to registry..."
    docker push $REGISTRY/gitworld-api:web-latest

    echo "✅ Web image pushed"
}

trigger_deploy() {
    echo "🚀 Triggering deployment..."
    doctl apps create-deployment $APP_ID --wait
    echo "✅ Deployment complete!"
}

case "${1:-all}" in
    api)
        deploy_api
        trigger_deploy
        ;;
    web)
        deploy_web
        trigger_deploy
        ;;
    all)
        deploy_api
        deploy_web
        trigger_deploy
        ;;
    *)
        echo "Usage: ./deploy.sh [api|web|all]"
        exit 1
        ;;
esac
