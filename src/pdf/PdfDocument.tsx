import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Quotation, Settings, Block } from '../types';
import { PreparedImages } from './prepareImages';
import { getPaymentRows, hasPaymentBlock } from '../utils/payment';
import { parseInline } from '../utils/richText';
import { getGroupNumber } from '../utils/numbering';

// Import font files
import arimoRegular from '../assets/fonts/Arimo-Regular.ttf';
import arimoBold from '../assets/fonts/Arimo-Bold.ttf';
import arimoItalic from '../assets/fonts/Arimo-Italic.ttf';
import arimoBoldItalic from '../assets/fonts/Arimo-BoldItalic.ttf';

// Register Arimo font family with 4 styles
Font.register({
  family: 'Arimo',
  fonts: [
    { src: arimoRegular, fontWeight: 'normal', fontStyle: 'normal' },
    { src: arimoBold, fontWeight: 'bold', fontStyle: 'normal' },
    { src: arimoItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: arimoBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

// Disable hyphenation completely
Font.registerHyphenationCallback((word) => [word]);

// Base unit: 1px on screen = 0.75pt in PDF (A4 595.28pt width, 690px editor width * 0.75 = 517.5pt)
export const PX = 0.75;

const COLOR_TEXT = '#111111';
const COLOR_SECONDARY = '#555555';
const COLOR_HEADING_BAR = '#f2f2f2';
const COLOR_DIVIDER = '#9a9a9a';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: 'Arimo',
    fontSize: 11 * PX,
    color: COLOR_TEXT,
  },
  // Fixed Page Number render prop at bottom right
  pageNumberContainer: {
    position: 'absolute',
    bottom: 20,
    right: 40,
  },
  pageNumberText: {
    fontSize: 9 * PX,
    color: COLOR_SECONDARY,
    fontFamily: 'Arimo',
  },
  // Header styles (first page only)
  headerContainer: {
    marginBottom: 16 * PX,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 20 * PX,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  agencyLabel: {
    fontSize: 12 * PX,
    color: COLOR_TEXT,
  },
  agencyName: {
    fontSize: 15 * PX,
    fontWeight: 'bold',
    color: COLOR_TEXT,
    marginTop: 2 * PX,
  },
  agencyAddress: {
    fontSize: 12 * PX,
    color: COLOR_TEXT,
    marginTop: 2 * PX,
    lineHeight: 1.4,
  },
  logoImage: {
    maxHeight: 48 * PX,
    maxWidth: 180 * PX,
    objectFit: 'contain',
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLOR_DIVIDER,
    marginTop: 16 * PX,
  },
  // Section styles
  sectionWrapper: {
    marginTop: 0,
  },
  sectionHeadingBar: {
    backgroundColor: COLOR_HEADING_BAR,
    paddingTop: 6 * PX,
    paddingBottom: 6 * PX,
    paddingLeft: 10 * PX,
    paddingRight: 10 * PX,
    marginTop: 20 * PX,
    marginBottom: 8 * PX,
  },
  sectionHeadingText: {
    fontSize: 11 * PX,
    fontWeight: 'bold',
    color: COLOR_TEXT,
  },
  // Block styles
  blockWrapper: {
    marginTop: 8 * PX,
  },
  bodyText: {
    fontSize: 11 * PX,
    color: COLOR_TEXT,
    lineHeight: 1.5,
  },
  // List items (bullets and numbered)
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3 * PX,
  },
  bulletMarkerCol: {
    width: 16 * PX,
    paddingTop: 0,
  },
  bulletMarker: {
    fontSize: 11 * PX,
    color: COLOR_TEXT,
  },
  numberedMarkerCol: {
    width: 16 * PX,
  },
  numberedMarker: {
    fontSize: 11 * PX,
    color: COLOR_TEXT,
  },
  listItemTextCol: {
    flex: 1,
  },
  // Group block
  groupTitleRow: {
    marginBottom: 4 * PX,
  },
  groupTitleText: {
    fontSize: 11 * PX,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: COLOR_TEXT,
  },
  groupBulletsContainer: {
    marginTop: 4 * PX,
  },
  // Payment footer
  paymentContainer: {
    flexDirection: 'row',
    marginTop: 28 * PX,
    alignItems: 'flex-start',
  },
  paymentQrCol: {
    width: 150 * PX,
    marginRight: 24 * PX,
  },
  paymentQrImageWrapper: {
    width: 150 * PX,
    height: 150 * PX,
    borderRadius: 14 * PX,
    overflow: 'hidden',
  },
  paymentQrImage: {
    width: 150 * PX,
    height: 150 * PX,
  },
  paymentDetailsCol: {
    flex: 1,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3 * PX,
  },
  paymentDetailText: {
    fontSize: 11 * PX,
    color: COLOR_TEXT,
    lineHeight: 1.5,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

/**
 * Pure helper to render rich text segments (bold, italic, bold-italic)
 */
function renderRichText(text: string, baseStyle?: any) {
  if (!text) return null;
  const segments = parseInline(text);

  return (
    <Text style={baseStyle}>
      {segments.map((seg, idx) => {
        let styleOverride: any = undefined;
        if (seg.bold && seg.italic) {
          styleOverride = { fontWeight: 'bold', fontStyle: 'italic' };
        } else if (seg.bold) {
          styleOverride = { fontWeight: 'bold' };
        } else if (seg.italic) {
          styleOverride = { fontStyle: 'italic' };
        }
        return (
          <Text key={idx} style={styleOverride}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

/**
 * Checks if a block has meaningful non-empty content to render
 */
function isBlockNonEmpty(block: Block): boolean {
  if (block.type === 'text') {
    return Boolean(block.content && block.content.trim() !== '');
  }
  if (block.type === 'bullets' || block.type === 'numbered') {
    return block.items.some((item) => item && item.trim() !== '');
  }
  if (block.type === 'group') {
    const hasTitle = Boolean(block.title && block.title.trim() !== '');
    const hasItems = block.items.some((item) => item && item.trim() !== '');
    return hasTitle || hasItems;
  }
  return false;
}

interface PdfDocumentProps {
  quotation: Quotation;
  settings: Settings;
  preparedImages: PreparedImages;
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({
  quotation,
  settings,
  preparedImages,
}) => {
  const showPayment = hasPaymentBlock(settings);
  const paymentRows = showPayment ? getPaymentRows(settings) : [];

  // Filter sections: skip section entirely if heading is empty AND all blocks are empty
  const activeSections = quotation.sections.filter((sec) => {
    const hasHeading = Boolean(sec.heading && sec.heading.trim() !== '');
    const hasBlocks = sec.blocks.some(isBlockNonEmpty);
    return hasHeading || hasBlocks;
  });

  return (
    <Document
      title={quotation.title || 'Quotation'}
      author={settings.agencyName || 'Agency'}
      creator="Quotation Builder"
    >
      <Page size="A4" style={styles.page}>

        {/* Header - FIRST PAGE ONLY (not fixed) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.agencyLabel}>AGENCY NAME :</Text>
              <Text style={styles.agencyName}>
                {settings.agencyName || 'Agency Name'}
              </Text>
              {Boolean(settings.address && settings.address.trim() !== '') && (
                <Text style={styles.agencyAddress}>{settings.address.trim()}</Text>
              )}
            </View>

            {preparedImages.logoDataUrl ? (
              <View style={styles.headerRight}>
                <Image
                  src={preparedImages.logoDataUrl}
                  style={styles.logoImage}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.headerDivider} />
        </View>

        {/* Sections and Blocks */}
        {activeSections.map((section, sIdx) => {
          const hasHeading = Boolean(section.heading && section.heading.trim() !== '');
          const validBlocks = section.blocks.filter(isBlockNonEmpty);

          return (
            <View key={section.id || sIdx} style={styles.sectionWrapper}>
              {/* Section Heading Bar: full width #f2f2f2, minPresenceAhead keeps it with first block */}
              {hasHeading && (
                <View
                  style={[
                    styles.sectionHeadingBar,
                    sIdx === 0 ? { marginTop: 8 * PX } : undefined,
                  ]}
                  minPresenceAhead={60 * PX}
                >
                  <Text style={styles.sectionHeadingText}>{section.heading}</Text>
                </View>
              )}

              {/* Blocks */}
              {validBlocks.map((block, bIdx) => {
                const isFirstBlock = bIdx === 0 && !hasHeading;
                const blockWrapperStyle = [
                  styles.blockWrapper,
                  isFirstBlock ? { marginTop: 0 } : undefined,
                ];

                if (block.type === 'text') {
                  return (
                    <View key={block.id} style={blockWrapperStyle} minPresenceAhead={20 * PX}>
                      {renderRichText(block.content, styles.bodyText)}
                    </View>
                  );
                }

                if (block.type === 'bullets') {
                  const items = block.items.filter((item) => item && item.trim() !== '');
                  return (
                    <View key={block.id} style={blockWrapperStyle}>
                      {items.map((item, itemIdx) => (
                        <View key={itemIdx} style={styles.listItemRow} wrap={false}>
                          <View style={styles.bulletMarkerCol}>
                            <Text style={styles.bulletMarker}>•</Text>
                          </View>
                          <View style={styles.listItemTextCol}>
                            {renderRichText(item, styles.bodyText)}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                }

                if (block.type === 'numbered') {
                  const items = block.items.filter((item) => item && item.trim() !== '');
                  return (
                    <View key={block.id} style={blockWrapperStyle}>
                      {items.map((item, itemIdx) => (
                        <View key={itemIdx} style={styles.listItemRow} wrap={false}>
                          <View style={styles.numberedMarkerCol}>
                            <Text style={styles.numberedMarker}>{itemIdx + 1}.</Text>
                          </View>
                          <View style={styles.listItemTextCol}>
                            {renderRichText(item, styles.bodyText)}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                }

                if (block.type === 'group') {
                  const groupNum = getGroupNumber(section, block.id);
                  const items = block.items.filter((item) => item && item.trim() !== '');
                  const firstBullet = items[0];
                  const remainingBullets = items.slice(1);

                  return (
                    <View key={block.id} style={blockWrapperStyle}>
                      {/* Group title stays with its first bullet */}
                      <View wrap={false}>
                        <View style={styles.groupTitleRow}>
                          <Text style={styles.groupTitleText}>
                            {groupNum}. {block.title || ''}
                          </Text>
                        </View>
                        {firstBullet && (
                          <View style={styles.listItemRow}>
                            <View style={styles.bulletMarkerCol}>
                              <Text style={styles.bulletMarker}>•</Text>
                            </View>
                            <View style={styles.listItemTextCol}>
                              {renderRichText(firstBullet, styles.bodyText)}
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Remaining bullets each wrap={false} */}
                      {remainingBullets.map((item, itemIdx) => (
                        <View key={itemIdx} style={styles.listItemRow} wrap={false}>
                          <View style={styles.bulletMarkerCol}>
                            <Text style={styles.bulletMarker}>•</Text>
                          </View>
                          <View style={styles.listItemTextCol}>
                            {renderRichText(item, styles.bodyText)}
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                }

                return null;
              })}
            </View>
          );
        })}

        {/* Payment Footer: wrap={false} moves as a whole to next page if it does not fit */}
        {showPayment && (
          <View style={styles.paymentContainer} wrap={false}>
            {/* Left QR Column */}
            {preparedImages.qrDataUrl ? (
              <View style={styles.paymentQrCol}>
                <View style={styles.paymentQrImageWrapper}>
                  <Image
                    src={preparedImages.qrDataUrl}
                    style={styles.paymentQrImage}
                  />
                </View>
              </View>
            ) : null}

            {/* Right Bank details Column */}
            {paymentRows.length > 0 && (
              <View style={styles.paymentDetailsCol}>
                {paymentRows.map((row, rIdx) => (
                  <View key={rIdx} style={styles.paymentDetailRow}>
                    <View style={styles.bulletMarkerCol}>
                      <Text style={styles.bulletMarker}>•</Text>
                    </View>
                    <View style={styles.listItemTextCol}>
                      <Text style={styles.paymentDetailText}>
                        {row.label}: <Text style={styles.boldText}>{row.value}</Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {/* Fixed bottom-right Page x of y on every page inside bottom margin */}
        <View style={styles.pageNumberContainer} fixed>
          <Text
            style={styles.pageNumberText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
