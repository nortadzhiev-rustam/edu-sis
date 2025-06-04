#!/bin/bash

# EAS CLI Automation Script for edu-sis
# Based on official Expo documentation: https://docs.expo.dev/eas/workflows/automating-eas-cli/
# Usage: ./scripts/eas-automation.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "EAS CLI Automation Script"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build           Build app using EAS Build"
    echo "  submit          Submit app to app stores"
    echo "  update          Publish OTA update"
    echo "  workflow        Run EAS Workflow"
    echo "  deploy          Full deployment (build + update + submit)"
    echo "  status          Check build/submit/update status"
    echo ""
    echo "Build Options:"
    echo "  --profile PROFILE       Build profile (development, preview, production)"
    echo "  --platform PLATFORM     Platform (android, ios, all)"
    echo "  --auto-submit           Auto-submit after successful build"
    echo "  --clear-cache           Clear cache before building"
    echo ""
    echo "Submit Options:"
    echo "  --platform PLATFORM     Platform (android, ios, all)"
    echo "  --build-id BUILD_ID     Specific build ID to submit"
    echo ""
    echo "Update Options:"
    echo "  --branch BRANCH         Update branch"
    echo "  --message MESSAGE       Update message"
    echo ""
    echo "Workflow Options:"
    echo "  --workflow WORKFLOW     Workflow file name"
    echo "  --input KEY=VALUE       Workflow input parameters"
    echo ""
    echo "Examples:"
    echo "  $0 build --profile production --platform android"
    echo "  $0 submit --platform ios"
    echo "  $0 update --branch preview --message 'Bug fixes'"
    echo "  $0 workflow --workflow build-all-platforms.yml"
    echo "  $0 deploy --profile production --platform all"
}

# Check if EAS CLI is installed
check_eas_cli() {
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI is not installed. Please install it with: npm install -g @expo/eas-cli"
        exit 1
    fi

    # Check if logged in
    if ! eas whoami &> /dev/null; then
        print_error "Not logged in to EAS. Please run: eas login"
        exit 1
    fi
}

# Build function
build_app() {
    local profile="development"
    local platform="all"
    local auto_submit=false
    local clear_cache=false

    # Parse build options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --profile)
                profile="$2"
                shift 2
                ;;
            --platform)
                platform="$2"
                shift 2
                ;;
            --auto-submit)
                auto_submit=true
                shift
                ;;
            --clear-cache)
                clear_cache=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    print_status "Building app with profile: $profile, platform: $platform"

    # Clear cache if requested
    if [ "$clear_cache" = true ]; then
        print_status "Clearing cache..."
        npm run clean
    fi

    # Build command
    local build_cmd="eas build --profile $profile --platform $platform --non-interactive"
    
    if [ "$auto_submit" = true ]; then
        build_cmd="$build_cmd --auto-submit"
    fi

    print_status "Running: $build_cmd"
    eval $build_cmd

    if [ $? -eq 0 ]; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Submit function
submit_app() {
    local platform="all"
    local build_id=""

    # Parse submit options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                platform="$2"
                shift 2
                ;;
            --build-id)
                build_id="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    print_status "Submitting app for platform: $platform"

    local submit_cmd="eas submit --platform $platform --non-interactive"
    
    if [ -n "$build_id" ]; then
        submit_cmd="$submit_cmd --id $build_id"
    fi

    print_status "Running: $submit_cmd"
    eval $submit_cmd

    if [ $? -eq 0 ]; then
        print_success "Submission completed successfully!"
    else
        print_error "Submission failed!"
        exit 1
    fi
}

# Update function
publish_update() {
    local branch=""
    local message=""

    # Parse update options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --branch)
                branch="$2"
                shift 2
                ;;
            --message)
                message="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    print_status "Publishing update"

    local update_cmd="eas update --non-interactive"
    
    if [ -n "$branch" ]; then
        update_cmd="$update_cmd --branch $branch"
    fi
    
    if [ -n "$message" ]; then
        update_cmd="$update_cmd --message \"$message\""
    else
        update_cmd="$update_cmd --auto"
    fi

    print_status "Running: $update_cmd"
    eval $update_cmd

    if [ $? -eq 0 ]; then
        print_success "Update published successfully!"
    else
        print_error "Update failed!"
        exit 1
    fi
}

# Workflow function
run_workflow() {
    local workflow=""
    local inputs=()

    # Parse workflow options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --workflow)
                workflow="$2"
                shift 2
                ;;
            --input)
                inputs+=("--input" "$2")
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    if [ -z "$workflow" ]; then
        print_error "Workflow file is required. Use --workflow option."
        exit 1
    fi

    print_status "Running EAS Workflow: $workflow"

    local workflow_cmd="eas workflow:run $workflow"
    
    # Add inputs if provided
    for input in "${inputs[@]}"; do
        workflow_cmd="$workflow_cmd $input"
    done

    print_status "Running: $workflow_cmd"
    eval $workflow_cmd

    if [ $? -eq 0 ]; then
        print_success "Workflow completed successfully!"
    else
        print_error "Workflow failed!"
        exit 1
    fi
}

# Deploy function (build + update + submit)
deploy_app() {
    local profile="production"
    local platform="all"

    # Parse deploy options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --profile)
                profile="$2"
                shift 2
                ;;
            --platform)
                platform="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    print_status "Starting full deployment for profile: $profile, platform: $platform"

    # Use workflow for production deployment
    if [ "$profile" = "production" ]; then
        print_status "Using production deployment workflow"
        run_workflow --workflow "production-deployment.yml" --input "platform=$platform" --input "auto_submit=true"
    elif [ "$profile" = "preview" ]; then
        print_status "Using preview deployment workflow"
        run_workflow --workflow "preview-deployment.yml" --input "platform=$platform"
    else
        # Manual deployment for development
        build_app --profile "$profile" --platform "$platform"
        publish_update --branch "$profile"
    fi
}

# Status function
check_status() {
    print_status "Checking EAS status..."
    
    echo ""
    print_status "Recent builds:"
    eas build:list --limit 5 --non-interactive
    
    echo ""
    print_status "Recent updates:"
    eas update:list --limit 5 --non-interactive
    
    echo ""
    print_status "Recent submissions:"
    eas submit:list --limit 5 --non-interactive
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi

    check_eas_cli

    local command="$1"
    shift

    case $command in
        build)
            build_app "$@"
            ;;
        submit)
            submit_app "$@"
            ;;
        update)
            publish_update "$@"
            ;;
        workflow)
            run_workflow "$@"
            ;;
        deploy)
            deploy_app "$@"
            ;;
        status)
            check_status
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
