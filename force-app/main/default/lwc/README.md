# Box UI Elements - Lightning Web Components

This directory contains the Salesforce Lightning Web Components (LWC) versions of the Box UI Elements, converted from React.

## Converted Components

### 1. boxButton
A customizable button component with support for loading states, icons, and animations.

**Properties:**
- `label` - Button text
- `type` - Button type (button, submit, reset)
- `size` - Button size (small, medium, large)
- `isDisabled` - Disabled state
- `isLoading` - Shows loading indicator
- `isSelected` - Selected state
- `showRadar` - Shows radar animation
- `iconName` - Salesforce icon name (e.g., 'utility:check')
- `className` - Additional CSS classes

**Events:**
- `buttonclick` - Fired when button is clicked

**Example Usage:**
```html
<c-box-button 
    label="Save" 
    type="submit"
    icon-name="utility:save"
    onbuttonclick={handleSave}>
</c-box-button>
```

### 2. boxCheckbox
A checkbox component with custom styling and support for labels, descriptions, and tooltips.

**Properties:**
- `label` - Checkbox label
- `name` - Input name attribute
- `value` - Input value
- `isChecked` - Checked state
- `isDisabled` - Disabled state
- `fieldLabel` - Label above checkbox
- `description` - Description text
- `tooltip` - Tooltip text
- `hideLabel` - Hide the label
- `className` - Additional CSS classes

**Events:**
- `checkboxchange` - Fired when checkbox state changes
- `checkboxfocus` - Fired on focus
- `checkboxblur` - Fired on blur

**Example Usage:**
```html
<c-box-checkbox
    label="I agree to the terms"
    name="agreement"
    value="terms"
    is-checked={isAgreed}
    description="Please read the terms carefully"
    oncheckboxchange={handleCheckboxChange}>
</c-box-checkbox>
```

### 3. boxModal
A modal dialog component with backdrop, loading state, and focus management.

**Properties:**
- `title` - Modal title
- `isOpen` - Open state
- `isLoading` - Loading state
- `size` - Modal size (small, medium, large)
- `className` - Additional CSS classes

**Events:**
- `requestclose` - Fired when modal should close

**Slots:**
- Default slot - Modal body content
- `footer` - Modal footer content

**Example Usage:**
```html
<c-box-modal
    title="Edit Record"
    is-open={isModalOpen}
    size="medium"
    onrequestclose={handleCloseModal}>
    
    <!-- Modal Body -->
    <div class="slds-p-around_medium">
        <p>Modal content goes here</p>
    </div>
    
    <!-- Modal Footer -->
    <div slot="footer">
        <c-box-button label="Cancel" onbuttonclick={handleCancel}></c-box-button>
        <c-box-button label="Save" onbuttonclick={handleSave}></c-box-button>
    </div>
</c-box-modal>
```

### 4. boxLoadingIndicator
An animated loading indicator with different sizes.

**Properties:**
- `size` - Size of the indicator (small, medium, large, default)
- `className` - Additional CSS classes

**Example Usage:**
```html
<c-box-loading-indicator size="large"></c-box-loading-indicator>
```

### 5. boxRadarAnimation
A radar pulse animation wrapper component.

**Properties:**
- `isShown` - Whether to show the radar animation
- `className` - Additional CSS classes

**Example Usage:**
```html
<c-box-radar-animation is-shown={showAnimation}>
    <lightning-button label="Click me"></lightning-button>
</c-box-radar-animation>
```

### 6. boxCheckboxTooltip
A tooltip component specifically for checkbox help text.

**Properties:**
- `tooltip` - Tooltip text to display

## Key Differences from React Version

1. **Event Handling**: React's synthetic events are replaced with LWC's custom events
2. **Props vs Properties**: React props become LWC @api properties
3. **State Management**: React state is replaced with LWC reactive properties
4. **Styling**: SCSS files are converted to standard CSS
5. **Conditional Rendering**: React's conditional rendering is replaced with LWC's template directives
6. **Icons**: Box custom icons are replaced with Salesforce's lightning-icon component

## Installation

1. Deploy these components to your Salesforce org
2. Add them to your Lightning pages, apps, or other LWC components
3. The components use Salesforce Lightning Design System (SLDS) for consistent styling

## Customization

The components maintain their original CSS classes for styling compatibility. You can override styles using CSS in your parent components or by passing custom classes via the `className` property.

## Notes

- These components are designed to work within the Salesforce platform
- They leverage SLDS for consistent look and feel
- Focus management and accessibility features are maintained from the original React components
- Some advanced features like portals and complex positioning may need adjustment based on your specific use case