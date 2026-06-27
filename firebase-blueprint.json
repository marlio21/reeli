{
  "entities": {
    "User": {
      "title": "User",
      "description": "User profile with account settings, storage, and alignment to subscription plans.",
      "type": "object",
      "properties": {
        "userId": { "type": "string", "description": "The firebase uid of the user." },
        "email": { "type": "string", "format": "email", "description": "User's primary email address." },
        "displayName": { "type": "string", "description": "Display name of the user." },
        "plan": { "type": "string", "enum": ["free", "starter", "premium", "pro", "business", "family"], "description": "Subscription tier of the user." },
        "storageLimitMB": { "type": "integer", "description": "Allowed storage limit." },
        "storageUsedMB": { "type": "number", "description": "Current storage used in megabytes." },
        "role": { "type": "string", "enum": ["user", "admin", "owner"], "description": "Internal role." },
        "acceptedTermsAt": { "type": "string", "format": "date-time", "description": "Timestamp indicating when AGB was accepted." },
        "acceptedPrivacyAt": { "type": "string", "format": "date-time", "description": "Timestamp indicating when Datenschutz was accepted." },
        "newsletterConsent": { "type": "boolean", "description": "Whether newsletter consent is given." },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["userId", "email", "plan", "storageLimitMB", "storageUsedMB", "role", "acceptedTermsAt", "acceptedPrivacyAt", "createdAt", "updatedAt"]
    },
    "Card": {
      "title": "Card",
      "description": "Digital mini-website containing background, profile, layout settings, and social buttons.",
      "type": "object",
      "properties": {
        "cardId": { "type": "string", "description": "Unique card identifier." },
        "ownerId": { "type": "string" },
        "type": { "type": "string", "enum": ["person", "company", "product", "project", "family", "team", "event", "club"] },
        "slug": { "type": "string", "description": "Dynamic suffix slug for URL matching." },
        "title": { "type": "string" },
        "subtitle": { "type": "string" },
        "description": { "type": "string" },
        "profileImageUrl": { "type": "string" },
        "backgroundType": { "type": "string", "enum": ["color", "image"] },
        "backgroundColor": { "type": "string" },
        "backgroundImageUrl": { "type": "string" },
        "overlay": { "type": "string", "enum": ["none", "light", "dark"] },
        "buttons": {
          "type": "array",
          "description": "Array of buttons for optimal single-read fetching."
        },
        "isPublished": { "type": "boolean" },
        "visibility": { "type": "string", "enum": ["public", "privateLink", "passwordProtected", "draft"] },
        "passwordHash": { "type": "string", "description": "Optional cryptographically secure target URL password gateway." },
        "brandingRequired": { "type": "boolean" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["cardId", "ownerId", "type", "slug", "title", "profileImageUrl", "backgroundType", "isPublished", "visibility", "createdAt", "updatedAt"]
    },
    "Plan": {
      "title": "Plan",
      "description": "Defines access permissions, storage limits, and functional capabilities of a tier.",
      "type": "object",
      "properties": {
        "planId": { "type": "string" },
        "name": { "type": "string" },
        "priceMonthly": { "type": "number" },
        "priceYearly": { "type": "number" },
        "storageLimitMB": { "type": "integer" },
        "maxCards": { "type": "integer" },
        "maxButtonsPerCard": { "type": "integer" },
        "maxPdfFiles": { "type": "integer" },
        "passwordButtonsEnabled": { "type": "boolean" },
        "backgroundImageEnabled": { "type": "boolean" },
        "analyticsEnabled": { "type": "boolean" },
        "brandingRequired": { "type": "boolean" },
        "buttonImagesEnabled": { "type": "boolean" }
      },
      "required": ["planId", "name", "priceMonthly", "priceYearly", "storageLimitMB", "maxCards", "maxButtonsPerCard", "passwordButtonsEnabled", "backgroundImageEnabled", "brandingRequired"]
    },
    "Group": {
      "title": "Group",
      "description": "Combines multiple cards into a unified family or team presentation page.",
      "type": "object",
      "properties": {
        "groupId": { "type": "string" },
        "ownerId": { "type": "string" },
        "type": { "type": "string", "enum": ["family", "team", "project", "company"] },
        "name": { "type": "string" },
        "memberCardIds": { "type": "array" },
        "slug": { "type": "string" },
        "isPublished": { "type": "boolean" },
        "visibility": { "type": "string", "enum": ["public", "privateLink", "draft"] },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["groupId", "ownerId", "type", "name", "memberCardIds", "slug", "isPublished", "visibility", "createdAt", "updatedAt"]
    },
    "Report": {
      "title": "Report",
      "description": "Submitted abuse reports for card moderation.",
      "type": "object",
      "properties": {
        "reportId": { "type": "string" },
        "cardId": { "type": "string" },
        "reason": { "type": "string" },
        "message": { "type": "string" },
        "reporterEmail": { "type": "string", "format": "email" },
        "status": { "type": "string", "enum": ["pending", "reviewed", "dismissed", "blocked"] },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["reportId", "cardId", "reason", "reporterEmail", "status", "createdAt", "updatedAt"]
    },
    "Analytics": {
      "title": "Analytics",
      "description": "Event logging for privacy-preserving clicks and visits count.",
      "type": "object",
      "properties": {
        "eventId": { "type": "string" },
        "cardId": { "type": "string" },
        "buttonId": { "type": "string" },
        "eventType": { "type": "string", "enum": ["view", "click"] },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["eventId", "cardId", "eventType", "createdAt"]
    },
    "LegalConsent": {
      "title": "LegalConsent",
      "description": "Historic legal agreement consents.",
      "type": "object",
      "properties": {
        "consentId": { "type": "string" },
        "userId": { "type": "string" },
        "type": { "type": "string", "enum": ["terms", "privacy", "newsletter"] },
        "version": { "type": "string" },
        "acceptedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["consentId", "userId", "type", "version", "acceptedAt"]
    },
    "Company": {
      "title": "Company",
      "description": "Company profile for Business subscribers.",
      "type": "object",
      "properties": {
        "companyId": { "type": "string" },
        "name": { "type": "string" },
        "ownerId": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" },
        "address": { "type": "string" }
      },
      "required": ["companyId", "name", "ownerId", "createdAt", "updatedAt"]
    },
    "CompanyMember": {
      "title": "CompanyMember",
      "description": "A team member participating in a company business account structure.",
      "type": "object",
      "properties": {
        "memberId": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "role": { "type": "string", "enum": ["owner", "admin", "editor", "viewer"] },
        "status": { "type": "string", "enum": ["active", "pending", "deactivated"] },
        "name": { "type": "string" },
        "userId": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["memberId", "email", "role", "status", "createdAt", "updatedAt"]
    },
    "Lead": {
      "title": "Lead",
      "description": "Form responses captured via public contact/leads form buttons stored locally.",
      "type": "object",
      "properties": {
        "leadId": { "type": "string" },
        "companyId": { "type": "string" },
        "cardId": { "type": "string" },
        "cardTitle": { "type": "string" },
        "buttonId": { "type": "string" },
        "buttonLabel": { "type": "string" },
        "formType": { "type": "string", "enum": ["contact_form", "inquiry_form", "callback_request"] },
        "status": { "type": "string", "enum": ["new", "contacted", "done", "archived"] },
        "name": { "type": "string" },
        "email": { "type": "string" },
        "phone": { "type": "string" },
        "topic": { "type": "string" },
        "message": { "type": "string" },
        "preferredTime": { "type": "string" },
        "sourceUrl": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["leadId", "companyId", "formType", "status", "createdAt", "updatedAt"]
    },
    "CompanyTemplate": {
      "title": "CompanyTemplate",
      "description": "Reusable corporate layout templates saved for creating future employee cards.",
      "type": "object",
      "properties": {
        "templateId": { "type": "string" },
        "companyId": { "type": "string" },
        "name": { "type": "string" },
        "type": { "type": "string", "enum": ["employee_card", "product_card", "service_card", "event_card"] },
        "description": { "type": "string" },
        "design": { "type": "object" },
        "defaultButtons": { "type": "array" },
        "createdAt": { "type": "string", "format": "date-time" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["templateId", "companyId", "name", "type", "createdAt", "updatedAt"]
    }
  },
  "firestore": {
    "/users/{userId}": {
      "schema": "User",
      "description": "Collection of user entities."
    },
    "/cards/{cardId}": {
      "schema": "Card",
      "description": "Collection of public or private cards."
    },
    "/plans/{planId}": {
      "schema": "Plan",
      "description": "Definition of different subscription plans."
    },
    "/groups/{groupId}": {
      "schema": "Group",
      "description": "Combined family or team cards."
    },
    "/reports/{reportId}": {
      "schema": "Report",
      "description": "Abuse complaints filed against links."
    },
    "/analytics/{eventId}": {
      "schema": "Analytics",
      "description": "User traffic and action clicks."
    },
    "/legalConsents/{consentId}": {
      "schema": "LegalConsent",
      "description": "Audit trails of user acceptances."
    },
    "/companies/{companyId}": {
      "schema": "Company",
      "description": "Business profile and centralized workspace settings."
    },
    "/companies/{companyId}/members/{memberId}": {
      "schema": "CompanyMember",
      "description": "Invited team members under a company profile."
    },
    "/companies/{companyId}/leads/{leadId}": {
      "schema": "Lead",
      "description": "Captured leads under a company profile."
    },
    "/companies/{companyId}/templates/{templateId}": {
      "schema": "CompanyTemplate",
      "description": "Card layout templates under a company profile."
    }
  }
}
