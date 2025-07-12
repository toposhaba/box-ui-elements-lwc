import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import UploadInput from './UploadInput';
import messages from '../common/messages';
import { supportsOCR, supportsTranscription } from '../../utils/contentProcessing';
import './ProcessingOptions.scss';

export interface UploadStateContentProps {
    fileInputLabel?: React.ReactNode;
    folderInputLabel?: React.ReactNode;
    message?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    useButton?: boolean;
    enableOCR?: boolean;
    enableTranscription?: boolean;
    onOCRChange?: (enabled: boolean) => void;
    onTranscriptionChange?: (enabled: boolean) => void;
}

const UploadStateContent = ({
    fileInputLabel,
    folderInputLabel,
    message,
    onChange,
    useButton = false,
    enableOCR = false,
    enableTranscription = false,
    onOCRChange,
    onTranscriptionChange,
}: UploadStateContentProps) => {
    const inputLabelClass = useButton ? 'btn btn-primary be-input-btn' : 'be-input-link'; // TODO: Refactor to use Blueprint components
    const canUploadFolder = !useButton && !!folderInputLabel;

    let inputsContent;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!onChange) {
            return;
        }

        onChange(event);

        const { currentTarget } = event;
        currentTarget.value = ''; // Reset the file input selection
    };

    const fileInputContent = fileInputLabel ? (
        <UploadInput inputLabel={fileInputLabel} inputLabelClass={inputLabelClass} onChange={handleChange} />
    ) : null;
    const folderInputContent = canUploadFolder ? (
        <UploadInput
            inputLabel={folderInputLabel}
            inputLabelClass={inputLabelClass}
            isFolderUpload
            onChange={handleChange}
        />
    ) : null;

    if (fileInputContent && folderInputContent) {
        inputsContent = (
            <FormattedMessage
                {...messages.uploadOptions}
                values={{
                    option1: fileInputContent,
                    option2: folderInputContent,
                }}
            />
        );
    } else if (fileInputContent) {
        inputsContent = fileInputContent;
    }

    const processingOptions = (
        <div className="bcu-processing-options">
            <div className="bcu-processing-option">
                <label>
                    <input
                        type="checkbox"
                        checked={enableOCR}
                        onChange={(e) => onOCRChange && onOCRChange(e.target.checked)}
                    />
                    <FormattedMessage {...messages.enableOCR} />
                </label>
            </div>
            <div className="bcu-processing-option">
                <label>
                    <input
                        type="checkbox"
                        checked={enableTranscription}
                        onChange={(e) => onTranscriptionChange && onTranscriptionChange(e.target.checked)}
                    />
                    <FormattedMessage {...messages.enableTranscription} />
                </label>
            </div>
        </div>
    );

    return (
        <div>
            {message && <div className="bcu-upload-state-message">{message}</div>}
            {inputsContent && <div className="bcu-upload-input-container">{inputsContent}</div>}
            {(onOCRChange || onTranscriptionChange) && processingOptions}
        </div>
    );
};

export default UploadStateContent;
